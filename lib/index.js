/**
 * @import {RegExpMatchObject, ReplaceFunction} from 'mdast-util-find-and-replace'
 * @import {CompileContext, Extension as FromMarkdownExtension, Handle as FromMarkdownHandle, Transform as FromMarkdownTransform} from 'mdast-util-from-markdown'
 * @import {ConstructName, Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 * @import {Link, Paragraph, PhrasingContent, Text} from 'mdast'
 */

import {ccount} from 'ccount'
import {ok as assert} from 'devlop'
import {unicodePunctuation, unicodeWhitespace} from 'micromark-util-character'
import {findAndReplace} from 'mdast-util-find-and-replace'
import {rewriteProtocolAutolinks} from './protocol-autolinks.js'

/** @type {ConstructName} */
const inConstruct = 'phrasing'
/** @type {Array<ConstructName>} */
const notInConstruct = ['autolink', 'link', 'image', 'label']

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM autolink literals.
 */
export function gfmAutolinkLiteralFromMarkdown() {
  const literalEmailLinks = new WeakSet()

  return {
    transforms: [createTransform(literalEmailLinks)],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: createExitLiteralAutolinkEmail(literalEmailLinks),
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  }
}

/**
 * @param {WeakSet<object>} literalEmailLinks
 *   Parser-produced literal email links.
 * @returns {FromMarkdownTransform}
 *   Tree transform bound to those links.
 */
function createTransform(literalEmailLinks) {
  return function (tree) {
    rewriteProtocolAutolinks(tree, literalEmailLinks, {
      replaceText,
      enclosingUrlEnd
    })
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM autolink literals.
 */
export function gfmAutolinkLiteralToMarkdown() {
  return {
    unsafe: [
      {
        character: '@',
        before: '[+\\-.\\w]',
        after: '[\\-.\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: '.',
        before: '[Ww]',
        after: '[\\-.\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: ':',
        before: '[ps]',
        after: '\\/',
        inConstruct,
        notInConstruct
      }
    ]
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolink(token) {
  // Trailing `position: undefined` keeps the link hidden class stable;
  // mdast-util-from-markdown's enter() patches the field to a real value
  // but the property already exists, so no shape transition fires.
  this.enter(
    {type: 'link', title: null, url: '', children: [], position: undefined},
    token
  )
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token)
  const node = this.stack[this.stack.length - 1]
  assert(node.type === 'link')
  node.url = 'http://' + this.sliceSerialize(token)
}

/**
 * @param {WeakSet<object>} literalEmailLinks
 *   Parser-produced literal email links.
 * @returns {FromMarkdownHandle}
 *   Exit handler bound to those links.
 */
function createExitLiteralAutolinkEmail(literalEmailLinks) {
  /** @this {CompileContext} @type {FromMarkdownHandle} */
  return function (token) {
    this.config.exit.autolinkEmail.call(this, token)
    const node = this.stack[this.stack.length - 1]

    assert(node.type === 'link')
    literalEmailLinks.add(node)
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolink(token) {
  this.exit(token)
}

/**
 * Apply fallback autolinking only to text not consumed by a protocol candidate.
 *
 * @param {Text} node
 *   Unprotected text.
 * @returns {Array<PhrasingContent>}
 *   Replacement nodes.
 */
function replaceText(node) {
  /** @type {Paragraph} */
  const parent = {type: 'paragraph', children: [node]}

  findAndReplace(
    parent,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, findUrl],
      [/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, findEmail]
    ],
    {ignore: ['link', 'linkReference']}
  )
  return parent.children
}

/**
 * Find an earlier fallback URL that contains a protocol candidate.
 *
 * @param {string} value
 *   Original text value.
 * @param {number} start
 *   End of previously consumed candidates.
 * @param {number} before
 *   Protocol candidate start.
 * @returns {number | undefined}
 *   Enclosing URL end.
 */
function enclosingUrlEnd(value, start, before) {
  const prefix = value.slice(start, before)
  const starts = /https?:\/\/|www\./gi
  let match = starts.exec(prefix)

  while (match) {
    const index = start + match.index
    const candidate = /^(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/i.exec(
      value.slice(index)
    )

    if (candidate) {
      const result = findUrl(
        candidate[0],
        candidate[1],
        candidate[2],
        candidate[3],
        {index, input: value, stack: [{type: 'text', value}]}
      )
      const link = Array.isArray(result) ? result[0] : result

      if (link && link.type === 'link') {
        const end = index + /** @type {Text} */ (link.children[0]).value.length

        if (end > before) return end
        starts.lastIndex = end - start
      }
    }

    match = starts.exec(prefix)
  }
}

/**
 * @param {string} _
 * @param {string} protocol
 * @param {string} domain
 * @param {string} path
 * @param {RegExpMatchObject} match
 * @returns {Array<PhrasingContent> | Link | false}
 */
// eslint-disable-next-line max-params
function findUrl(_, protocol, domain, path, match) {
  let prefix = ''

  // Not an expected previous character.
  if (!previous(match)) {
    return false
  }

  // Treat `www` as part of the domain.
  if (/^w/i.test(protocol)) {
    domain = protocol + domain
    protocol = ''
    prefix = 'http://'
  }

  if (!isCorrectDomain(domain)) {
    return false
  }

  const parts = splitUrl(domain + path)

  if (!parts[0]) return false

  // Trailing `position: undefined` on every node literal keeps each
  // link / text hidden class stable; an upstream pass in find-and-replace
  // patches the field to a real value before the node is observable.
  /** @type {Link} */
  const result = {
    type: 'link',
    title: null,
    url: prefix + protocol + parts[0],
    children: [{type: 'text', value: protocol + parts[0], position: undefined}],
    position: undefined
  }

  if (parts[1]) {
    return [result, {type: 'text', value: parts[1], position: undefined}]
  }

  return result
}

/**
 * @type {ReplaceFunction}
 * @param {string} _
 * @param {string} atext
 * @param {string} label
 * @param {RegExpMatchObject} match
 * @returns {Link | false}
 */
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous(match, true) ||
    // Label ends in not allowed character.
    /[-\d_]$/.test(label)
  ) {
    return false
  }

  // See findUrl above for the rationale on the trailing position field.
  return {
    type: 'link',
    title: null,
    url: 'mailto:' + atext + '@' + label,
    children: [{type: 'text', value: atext + '@' + label, position: undefined}],
    position: undefined
  }
}

/**
 * @param {string} domain
 * @returns {boolean}
 */
function isCorrectDomain(domain) {
  const parts = domain.split('.')

  if (
    parts.length < 2 ||
    (parts[parts.length - 1] &&
      (/_/.test(parts[parts.length - 1]) ||
        !/[a-zA-Z\d]/.test(parts[parts.length - 1]))) ||
    (parts[parts.length - 2] &&
      (/_/.test(parts[parts.length - 2]) ||
        !/[a-zA-Z\d]/.test(parts[parts.length - 2])))
  ) {
    return false
  }

  return true
}

/**
 * @param {string} url
 * @returns {[string, string | undefined]}
 */
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url)

  if (!trailExec) {
    return [url, undefined]
  }

  url = url.slice(0, trailExec.index)

  let trail = trailExec[0]
  let closingParenIndex = trail.indexOf(')')
  const openingParens = ccount(url, '(')
  let closingParens = ccount(url, ')')

  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail.slice(0, closingParenIndex + 1)
    trail = trail.slice(closingParenIndex + 1)
    closingParenIndex = trail.indexOf(')')
    closingParens++
  }

  return [url, trail]
}

/**
 * @param {RegExpMatchObject} match
 * @param {boolean | null | undefined} [email=false]
 * @returns {boolean}
 */
function previous(match, email) {
  const code = match.input.charCodeAt(match.index - 1)

  return (
    (match.index === 0 ||
      unicodeWhitespace(code) ||
      unicodePunctuation(code)) &&
    // If it’s an email, the previous character should not be a slash.
    (!email || code !== 47)
  )
}
