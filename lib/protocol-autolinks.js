/**
 * @import {Link, Nodes, PhrasingContent, Text} from 'mdast'
 */

import {ok as assert} from 'devlop'
import {scanProtocolEdits} from './protocol-email.js'

/** @typedef {{node: Nodes, start: number, end: number, exact: boolean, inexactBefore: number, lineStarts: Array<number>}} ProtocolSegment */
/** @typedef {{replaceText: (node: Text) => Array<PhrasingContent>, enclosingUrlEnd: (value: string, start: number, before: number) => number | undefined}} Fallback */

/**
 * Re-scan contiguous text and literal-email nodes for cmark-gfm's protocol
 * email behavior.
 *
 * @param {Nodes} tree
 *   Tree.
 * @param {WeakSet<object>} literalEmailLinks
 *   Parser-created literal email links.
 * @param {Fallback} fallback
 *   Existing text autolinking and URL precedence.
 * @returns {undefined}
 *   Nothing.
 */
export function rewriteProtocolAutolinks(tree, literalEmailLinks, fallback) {
  if (!('children' in tree) || !Array.isArray(tree.children)) return

  const children = /** @type {Array<Nodes>} */ (tree.children)
  /** @type {Array<Nodes>} */
  const result = []
  let index = 0

  while (index < children.length) {
    const first = children[index]
    const firstValue = protocolRunValue(first, literalEmailLinks)

    if (firstValue === undefined) {
      result.push(first)
      index++
      continue
    }

    /** @type {Array<Nodes>} */
    const run = [first]
    let value = firstValue
    let previous = first
    let runIndex = index + 1

    while (runIndex < children.length) {
      const node = children[runIndex]
      const nodeValue = protocolRunValue(node, literalEmailLinks)

      if (nodeValue === undefined || !adjacent(previous, node)) break

      run.push(node)
      value += nodeValue
      previous = node
      runIndex++
    }

    for (const node of rewriteRun(run, value, fallback)) result.push(node)

    index = runIndex
  }

  children.length = 0

  for (const child of result) {
    if (child.type !== 'link' && child.type !== 'linkReference') {
      rewriteProtocolAutolinks(child, literalEmailLinks, fallback)
    }

    children.push(child)
  }
}

/**
 * Apply protocol and fallback autolinks to one source-contiguous run.
 *
 * @param {Array<Nodes>} run
 *   Original text and literal-email nodes.
 * @param {string} value
 *   Decoded run value.
 * @param {Fallback} fallback
 *   Existing text autolinking and URL precedence.
 * @returns {Array<Nodes>}
 *   Replacement nodes.
 */
function rewriteRun(run, value, fallback) {
  const protocolText = new WeakSet()
  const candidates = /mailto:|xmpp:/.test(value) ? scanProtocolEdits(value) : []
  const segments = candidates.length > 0 ? protocolRunSegments(run) : []
  /** @type {typeof candidates} */
  const edits = []
  let consumed = 0

  for (const candidate of candidates) {
    if (candidate.start < consumed) continue
    const segment =
      segments[protocolSegmentIndex(segments, candidate.start, false)]
    const urlEnd =
      segment.node.type === 'text'
        ? fallback.enclosingUrlEnd(
            segment.node.value,
            Math.max(0, consumed - segment.start),
            candidate.start - segment.start
          )
        : undefined

    if (urlEnd === undefined) edits.push(candidate)
    consumed = urlEnd === undefined ? candidate.end : segment.start + urlEnd
  }

  const replacements =
    edits.length === 0
      ? /** @type {Array<Nodes>} */ (run)
      : applyProtocolEdits(segments, value, edits, protocolText)
  /** @type {Array<Nodes>} */
  const linked = []

  for (const replacement of replacements) {
    if (replacement.type === 'text' && !protocolText.has(replacement)) {
      for (const node of fallback.replaceText(replacement)) linked.push(node)
    } else {
      linked.push(replacement)
    }
  }

  return edits.length === 0 ? linked : preserveText(segments, value, linked)
}

/**
 * @param {Nodes} node
 *   Possible text or literal-email node.
 * @param {WeakSet<object>} literalEmailLinks
 *   Extension-created literal email links.
 * @returns {string | undefined}
 *   Source value when the node can participate in a protocol scan.
 */
function protocolRunValue(node, literalEmailLinks) {
  return node.type === 'text'
    ? node.value || undefined
    : literalEmailValue(node, literalEmailLinks.has(node))
}

/**
 * Apply local protocol edits while preserving unaffected input nodes.
 *
 * @param {Array<ProtocolSegment>} segments
 *   Original nodes mapped to decoded offsets.
 * @param {string} value
 *   Decoded run value.
 * @param {Array<{start: number, end: number, linkStart?: number, linkEnd?: number}>} edits
 *   Protocol edits.
 * @param {WeakSet<object>} protocolText
 *   Text consumed by protocol candidates, excluded from fallback autolinking.
 * @returns {Array<PhrasingContent>}
 *   Replacement nodes.
 */
function applyProtocolEdits(segments, value, edits, protocolText) {
  /** @type {Array<PhrasingContent>} */
  const result = []
  const copyState = {segments, value, result, index: 0, textOnly: false}
  let offset = 0

  for (const edit of edits) {
    copyProtocolRange(copyState, offset, edit.start)

    if (edit.linkStart === undefined || edit.linkEnd === undefined) {
      const startIndex = result.length

      if (protocolEditOverlapsLink(segments, edit)) {
        result.push(protocolTextNode(segments, value, edit.start, edit.end))
      } else {
        copyProtocolRange(copyState, edit.start, edit.end)
      }

      for (let index = startIndex; index < result.length; index++) {
        protocolText.add(result[index])
      }
    } else {
      if (edit.start < edit.linkStart) {
        const prefix = protocolTextNode(
          segments,
          value,
          edit.start,
          edit.linkStart
        )
        protocolText.add(prefix)
        result.push(prefix)
      }

      const linkValue = value.slice(edit.linkStart, edit.linkEnd)
      const position = protocolRangePosition(
        segments,
        edit.linkStart,
        edit.linkEnd
      )

      result.push({
        type: 'link',
        title: null,
        url: linkValue,
        children: [{type: 'text', value: linkValue, position}],
        position
      })
    }

    offset = edit.end
  }

  copyProtocolRange(copyState, offset, value.length)
  return result
}

/**
 * Reuse original text nodes wherever the final result still contains text.
 *
 * @param {Array<ProtocolSegment>} segments
 *   Original nodes.
 * @param {string} value
 *   Decoded run value.
 * @param {Array<Nodes>} nodes
 *   Final text and links.
 * @returns {Array<PhrasingContent>}
 *   Result with unchanged text identity, metadata and positions preserved.
 */
function preserveText(segments, value, nodes) {
  /** @type {Array<PhrasingContent>} */
  const result = []
  const state = {segments, value, result, index: 0, textOnly: true}
  let offset = 0
  let start = 0

  for (const node of nodes) {
    if (node.type === 'link') {
      copyProtocolRange(state, start, offset)
      result.push(node)
      offset += /** @type {Text} */ (node.children[0]).value.length
      start = offset
    } else {
      offset += /** @type {Text} */ (node).value.length
    }
  }

  copyProtocolRange(state, start, offset)
  return result
}

/**
 * @param {Array<ProtocolSegment>} segments
 *   Run segments.
 * @param {{start: number, end: number}} edit
 *   Invalid protocol edit.
 * @returns {boolean}
 *   Whether the edit must undo a literal email link.
 */
function protocolEditOverlapsLink(segments, edit) {
  let index = protocolSegmentIndex(segments, edit.start, false)

  while (index < segments.length && segments[index].start < edit.end) {
    if (segments[index].node.type === 'link') return true
    index++
  }

  return false
}

/**
 * @param {Array<Nodes>} run
 *   Contiguous text and literal-email nodes.
 * @returns {Array<ProtocolSegment>}
 *   Nodes mapped to decoded offsets.
 */
function protocolRunSegments(run) {
  /** @type {Array<ProtocolSegment>} */
  const segments = []
  let inexact = 0
  let offset = 0

  for (const node of run) {
    const nodeValue =
      node.type === 'text'
        ? node.value
        : /** @type {Text} */ (/** @type {Link} */ (node).children[0]).value
    const end = offset + nodeValue.length

    const exact =
      node.type === 'text'
        ? textPositionMatchesValue(node)
        : node.position !== undefined
    const lineStarts = [0]
    const lineEnding = /\r\n|\r|\n/g
    let lineBreak = lineEnding.exec(nodeValue)

    while (lineBreak) {
      lineStarts.push(lineBreak.index + lineBreak[0].length)
      lineBreak = lineEnding.exec(nodeValue)
    }

    segments.push({
      node,
      start: offset,
      end,
      exact,
      inexactBefore: inexact,
      lineStarts
    })
    if (!exact) inexact++
    offset = end
  }

  return segments
}

/**
 * Copy an unaffected decoded range, retaining complete original nodes.
 *
 * @param {{segments: Array<ProtocolSegment>, value: string, result: Array<PhrasingContent>, index: number, textOnly: boolean}} state
 *   Monotonic copy state.
 * @param {number} start
 *   Start offset.
 * @param {number} end
 *   End offset.
 * @returns {undefined}
 *   Nothing.
 */
function copyProtocolRange(state, start, end) {
  while (
    state.index < state.segments.length &&
    state.segments[state.index].end <= start
  ) {
    state.index++
  }

  while (state.index < state.segments.length) {
    const segment = state.segments[state.index]
    const rangeStart = Math.max(start, segment.start)
    const rangeEnd = Math.min(end, segment.end)

    if (rangeStart >= rangeEnd) {
      break
    }

    if (
      rangeStart === segment.start &&
      rangeEnd === segment.end &&
      (!state.textOnly || segment.node.type === 'text')
    ) {
      state.result.push(/** @type {PhrasingContent} */ (segment.node))
    } else {
      state.result.push(
        protocolTextNode(state.segments, state.value, rangeStart, rangeEnd)
      )
    }

    if (rangeEnd < segment.end) break
    state.index++
  }
}

/**
 * @param {Array<ProtocolSegment>} segments
 *   Run segments.
 * @param {string} value
 *   Decoded run value.
 * @param {number} start
 *   Start offset.
 * @param {number} end
 *   End offset.
 * @returns {import('mdast').Text}
 *   Text node.
 */
function protocolTextNode(segments, value, start, end) {
  return {
    type: 'text',
    value: value.slice(start, end),
    position: protocolRangePosition(segments, start, end)
  }
}

/**
 * @param {Array<ProtocolSegment>} segments
 *   Run segments.
 * @param {number} start
 *   Start offset.
 * @param {number} end
 *   End offset.
 * @returns {import('unist').Position | undefined}
 *   Exact source range when every overlapping segment maps directly.
 */
function protocolRangePosition(segments, start, end) {
  const firstIndex = protocolSegmentIndex(segments, start, false)
  const lastIndex = protocolSegmentIndex(segments, end, true)
  const first = segments[firstIndex]
  const last = segments[lastIndex]
  const inexact =
    last.inexactBefore + (last.exact ? 0 : 1) - first.inexactBefore

  if (inexact > 0) return

  const firstPosition = /** @type {import('unist').Position} */ (
    first.node.position
  )
  const lastPosition = /** @type {import('unist').Position} */ (
    last.node.position
  )

  const rangeStart = movePointInText(
    firstPosition.start,
    start - first.start,
    first.lineStarts
  )
  const rangeEnd = movePointInText(
    lastPosition.start,
    end - last.start,
    last.lineStarts
  )

  return {start: rangeStart, end: rangeEnd}
}

/**
 * Find the segment containing a decoded offset.
 *
 * @param {Array<ProtocolSegment>} segments
 *   Run segments.
 * @param {number} offset
 *   Decoded offset.
 * @param {boolean} ending
 *   Whether the offset is an exclusive range end.
 * @returns {number}
 *   Segment index.
 */
function protocolSegmentIndex(segments, offset, ending) {
  const target = ending ? offset - 1 : offset
  let low = 0
  let high = segments.length - 1

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    const segment = segments[middle]

    if (target >= segment.end) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  return low
}

/**
 * @param {import('unist').Point} point
 *   Start point.
 * @param {number} amount
 *   UTF-16 code units to move.
 * @param {Array<number>} lineStarts
 *   Decoded offsets where lines start, including zero.
 * @returns {import('unist').Point}
 *   Moved point.
 */
function movePointInText(point, amount, lineStarts) {
  assert(typeof point.offset === 'number')
  let low = 0
  let high = lineStarts.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)

    if (lineStarts[middle] <= amount) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  const lineBreaks = low - 1
  const line = point.line + lineBreaks
  const column = lineBreaks
    ? amount - lineStarts[lineBreaks] + 1
    : point.column + amount

  return {line, column, offset: point.offset + amount}
}

/**
 * Return a source email literal, excluding explicit and angle links whose text
 * and destination happen to have the same values.
 *
 * @param {Nodes} node
 *   Possible email link.
 * @param {boolean} recognized
 *   Whether this transform or its parser handlers created the link.
 * @returns {string | undefined}
 *   Email text when this is a source or transform-generated literal.
 */
function literalEmailValue(node, recognized) {
  if (
    !recognized ||
    node.type !== 'link' ||
    node.title !== null ||
    node.children.length !== 1 ||
    node.children[0].type !== 'text'
  ) {
    return undefined
  }

  const value = node.children[0].value

  return node.url === 'mailto:' + value ? value : undefined
}

/**
 * @param {Text} node
 *   Text node.
 * @returns {boolean}
 *   Whether source and decoded value have the same width.
 */
function textPositionMatchesValue(node) {
  const start = node.position && node.position.start.offset
  const end = node.position && node.position.end.offset

  return (
    typeof start === 'number' &&
    typeof end === 'number' &&
    end - start === node.value.length
  )
}

/**
 * @param {Nodes} left
 *   Earlier node.
 * @param {Nodes} right
 *   Later node.
 * @returns {boolean}
 *   Whether their source ranges touch.
 */
function adjacent(left, right) {
  if (left.position === undefined || right.position === undefined) return true

  const leftEnd = left.position && left.position.end.offset
  const rightStart = right.position && right.position.start.offset

  return (
    typeof leftEnd === 'number' &&
    typeof rightStart === 'number' &&
    leftEnd === rightStart
  )
}
