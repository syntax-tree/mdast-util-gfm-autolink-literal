/**
 * @import {RegExpMatchObject, ReplaceFunction} from 'mdast-util-find-and-replace'
 * @import {CompileContext, Extension as FromMarkdownExtension, Handle as FromMarkdownHandle, Transform as FromMarkdownTransform} from 'mdast-util-from-markdown'
 * @import {ConstructName, Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 * @import {Link, PhrasingContent} from 'mdast'
 */

import {ccount} from 'ccount'
import {ok as assert} from 'devlop'
import {unicodePunctuation, unicodeWhitespace} from 'micromark-util-character'
import {findAndReplace} from 'mdast-util-find-and-replace'

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
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
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
 * Handle the start of an autolink literal.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolink(token) {
  this.enter(
    {type: 'link', title: null, url: '', children: [], position: undefined},
    token
  )
}

/**
 * Handle the start of an autolink literal value.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token)
}

/**
 * Handle the end of an HTTP autolink literal value.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token)
}

/**
 * Handle the end of a `www` autolink literal value.
 *
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
 * Handle the end of an email autolink literal value.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token)
}

/**
 * Handle the end of an autolink literal.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolink(token) {
  this.exit(token)
}

/**
 * Find autolink literals in text and turn them into links.
 *
 * @type {FromMarkdownTransform}
 */
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [
        /(?<![\da-z])(https?:\/\/|www(?=\.))([\w-]*\.[\w\-.]*)([^\t\n\r ]*)/gi,
        findUrl
      ],
      [/(?<![\w+\-.])([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)/g, findEmail]
    ],
    {ignore: ['link', 'linkReference']}
  )
}

/**
 * Turn a URL match into a link.
 *
 * @type {ReplaceFunction}
 * @param {string} _
 *   Whole match.
 * @param {string} protocol
 *   Protocol (`http://`, `https://`) or `www`.
 * @param {string} domain
 *   Host name, up to the path.
 * @param {string} path
 *   Path, query, and fragment.
 * @param {RegExpMatchObject} match
 *   Match object.
 * @returns {Array<PhrasingContent> | Link | false}
 *   Link, link and trailing text, or `false` if not a URL.
 */
// eslint-disable-next-line max-params
function findUrl(_, protocol, domain, path, match) {
  // Not an expected previous character.
  if (!previous(match)) {
    return false
  }

  let prefix = ''

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
 * Turn an email match into a link.
 *
 * @type {ReplaceFunction}
 * @param {string} _
 *   Whole match.
 * @param {string} atext
 *   Local part.
 * @param {string} label
 *   Domain.
 * @returns {Link | false}
 *   Link, or `false` if not an email.
 */
function findEmail(_, atext, label) {
  if (/[\d\-_]$/.test(label)) {
    return false
  }

  return {
    type: 'link',
    title: null,
    url: 'mailto:' + atext + '@' + label,
    children: [{type: 'text', value: atext + '@' + label, position: undefined}],
    position: undefined
  }
}

/**
 * Check if a domain is valid.
 *
 * @param {string} domain
 *   Host name to check.
 * @returns {boolean}
 *   Whether the domain is valid.
 */
function isCorrectDomain(domain) {
  const parts = domain.split('.')

  if (
    parts.length < 2 ||
    (parts[parts.length - 1] &&
      (/_/.test(parts[parts.length - 1]) ||
        !/[\dA-Za-z]/.test(parts[parts.length - 1]))) ||
    (parts[parts.length - 2] &&
      (/_/.test(parts[parts.length - 2]) ||
        !/[\dA-Za-z]/.test(parts[parts.length - 2])))
  ) {
    return false
  }

  return true
}

/**
 * Split trailing punctuation off a URL.
 *
 * @param {string} url
 *   Value to split.
 * @returns {[string, string | undefined]}
 *   URL and trailing punctuation, if any.
 */
function splitUrl(url) {
  let index = url.length

  while (index > 0) {
    const code = url.charCodeAt(index - 1)

    if (
      code === 33 /* `!` */ ||
      code === 34 /* `"` */ ||
      code === 38 /* `&` */ ||
      code === 39 /* `'` */ ||
      code === 41 /* `)` */ ||
      code === 44 /* `,` */ ||
      code === 46 /* `.` */ ||
      code === 58 /* `:` */ ||
      code === 59 /* `;` */ ||
      code === 60 /* `<` */ ||
      code === 62 /* `>` */ ||
      code === 63 /* `?` */ ||
      code === 93 /* `]` */ ||
      code === 125 /* `}` */
    ) {
      index--
    } else {
      break
    }
  }

  if (index === url.length) {
    return [url, undefined]
  }

  let trail = url.slice(index)
  url = url.slice(0, index)
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
 * Check if the character before a match is allowed.
 *
 * @param {RegExpMatchObject} match
 *   Match object.
 * @returns {boolean}
 *   Whether the previous character is allowed.
 */
function previous(match) {
  const code = match.input.charCodeAt(match.index - 1)

  return (
    match.index === 0 || unicodeWhitespace(code) || unicodePunctuation(code)
  )
}
