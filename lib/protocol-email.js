/**
 * Find protocol-email edits with cmark-gfm's email algorithm.
 *
 * @param {string} value
 *   Decoded text.
 * @returns {Array<{start: number, end: number, linkStart?: number, linkEnd?: number}>}
 *   Local edits for recognized protocol candidates.
 */
export function scanProtocolEdits(value) {
  /** @type {Array<{start: number, end: number, linkStart?: number, linkEnd?: number}>} */
  const edits = []
  let offset = 0

  while (offset < value.length) {
    const candidate = protocolEmailCandidate(value, offset)

    if (!candidate) break

    offset = candidate.nextOffset
    if (candidate.edit) edits.push(candidate.edit)
  }

  return edits
}

/**
 * Find the next email candidate, including cmark-gfm's repeated-at restart.
 *
 * @param {string} value
 *   Decoded text.
 * @param {number} offset
 *   Scan offset.
 * @returns {{nextOffset: number, edit?: {start: number, end: number, linkStart?: number, linkEnd?: number}} | undefined}
 *   Candidate result, or `undefined` when there are no more at-signs.
 */
function protocolEmailCandidate(value, offset) {
  let at = value.indexOf('@', offset)

  if (at === -1) return

  let maximumRewind = at - offset
  /** @type {number | undefined} */
  let editStart
  let isXmpp = false
  let dots = 0

  while (at < value.length) {
    const atext = scanAtext(value, at, maximumRewind)

    if (atext.protocol && editStart === undefined) {
      editStart = at - atext.rewind
    }

    isXmpp ||= atext.isXmpp

    if (atext.rewind === 0) {
      return editStart === undefined
        ? {nextOffset: at + 1}
        : {nextOffset: at + 1, edit: {start: editStart, end: at + 1}}
    }

    const domain = scanEmailDomain(value, at, isXmpp)

    dots += domain.dots

    if (domain.restartAt !== undefined) {
      offset = at + 1
      maximumRewind = domain.restartAt - offset
      at = domain.restartAt
      continue
    }

    if (
      domain.end - at < 2 ||
      dots === 0 ||
      !/[A-Za-z.]/.test(value.charAt(domain.end - 1))
    ) {
      return editStart === undefined
        ? {nextOffset: domain.end}
        : {
            nextOffset: domain.end,
            edit: {start: editStart, end: domain.end}
          }
    }

    const start = at - atext.rewind
    const end = domain.end
    return editStart === undefined
      ? {nextOffset: end}
      : {
          nextOffset: end,
          edit: {
            start: editStart,
            end,
            linkStart: start,
            linkEnd: end
          }
        }
  }
}

/**
 * Rewind over the atext before an at-sign.
 *
 * @param {string} value
 *   Decoded text.
 * @param {number} at
 *   At-sign offset.
 * @param {number} maximumRewind
 *   Maximum rewind within the current scan.
 * @returns {{rewind: number, protocol: boolean, isXmpp: boolean}}
 *   Rewind and recognized protocol state.
 */
function scanAtext(value, at, maximumRewind) {
  let rewind = 0
  let protocol = false
  let isXmpp = false

  while (rewind < maximumRewind) {
    const character = value.charAt(at - rewind - 1)

    if (/[\w.+-]/.test(character)) {
      rewind++
      continue
    }

    const state = {value, at, rewind, maximumRewind}

    if (character === ':' && validProtocol('mailto:', state)) {
      protocol = true
      rewind++
      continue
    }

    if (character === ':' && validProtocol('xmpp:', state)) {
      protocol = true
      isXmpp = true
      rewind++
      continue
    }

    break
  }

  return {rewind, protocol, isXmpp}
}

/**
 * Scan a domain and optional XMPP resource after an at-sign.
 *
 * @param {string} value
 *   Decoded text.
 * @param {number} at
 *   At-sign offset.
 * @param {boolean} isXmpp
 *   Whether XMPP resource slashes are allowed.
 * @returns {{end: number, dots: number, restartAt?: number}}
 *   Domain end, dot count, and optional restart at-sign.
 */
function scanEmailDomain(value, at, isXmpp) {
  let dots = 0
  let end = at + 1

  while (end < value.length) {
    const character = value.charAt(end)

    if (/[A-Za-z\d]/.test(character)) {
      end++
      continue
    }

    if (character === '@') return {end, dots, restartAt: end}

    if (character === '.' && /[A-Za-z\d]/.test(value.charAt(end + 1))) {
      dots++
      end++
      continue
    }

    if (
      (character === '/' && isXmpp) ||
      character === '-' ||
      character === '_'
    ) {
      end++
      continue
    }

    break
  }

  return {end, dots}
}

/**
 * @param {string} expected
 *   Protocol including its colon.
 * @param {{value: string, at: number, rewind: number, maximumRewind: number}} state
 *   Current atext scan state.
 * @returns {boolean}
 *   Whether the protocol is present at a valid boundary.
 */
function validProtocol(expected, state) {
  const {value, at, rewind, maximumRewind} = state
  const available = maximumRewind - rewind

  if (expected.length > available) return false

  const start = at - rewind - expected.length

  return (
    value.slice(start, at - rewind) === expected &&
    (expected.length === available ||
      !/[A-Za-z\d]/.test(value.charAt(start - 1)))
  )
}
