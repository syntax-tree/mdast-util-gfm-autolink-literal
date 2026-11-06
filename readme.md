# mdast-util-gfm-autolink-literal

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]

[mdast][github-mdast] extensions to parse and serialize
[GFM][spec-gfm] autolink literals.

## Contents

* [What is this?](#what-is-this)
* [When to use this](#when-to-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`gfmAutolinkLiteralFromMarkdown()`](#gfmautolinkliteralfrommarkdown)
  * [`gfmAutolinkLiteralToMarkdown()`](#gfmautolinkliteraltomarkdown)
* [HTML](#html)
* [Syntax](#syntax)
* [Syntax tree](#syntax-tree)
* [Types](#types)
* [Compatibility](#compatibility)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package contains two extensions that add support for GFM autolink literals
syntax in markdown to [mdast][github-mdast].
These extensions plug into
[`mdast-util-from-markdown`][github-mdast-util-from-markdown]
(to support parsing GFM autolinks in markdown into a syntax tree) and
[`mdast-util-to-markdown`][github-mdast-util-to-markdown]
(to support serializing GFM autolinks in syntax trees to markdown).

GitHub employs different algorithms to autolink: one at parse time and one at
transform time (similar to how `@mentions` are done at transform time).
This difference can be observed because character references and escapes are
handled differently.
But also because issues/PRs/comments omit (perhaps by accident?) the second
algorithm for `www.`, `http://`, and `https://` links (but not for email links).

As the corresponding micromark extension
[`micromark-extension-gfm-autolink-literal`][github-micromark-extension]
is a syntax extension,
it can only perform the first algorithm.
The tree extension `gfmAutolinkLiteralFromMarkdown` from this package can
perform the second algorithm, and as they are combined, both are done.

## When to use this

You can use these extensions when you are working with
`mdast-util-from-markdown` and `mdast-util-to-markdown` already.

When working with `mdast-util-from-markdown`, you must combine this package
with
[`micromark-extension-gfm-autolink-literal`][github-micromark-extension].

When you don’t need a syntax tree, you can use [`micromark`][github-micromark]
directly with `micromark-extension-gfm-autolink-literal`.

When you are working with syntax trees and want all of GFM, use
[`mdast-util-gfm`][github-mdast-util-gfm] instead.

All these packages are used [`remark-gfm`][github-remark-gfm], which
focusses on making it easier to transform content by abstracting these
internals away.

This utility does not handle how markdown is turned to HTML.
That’s done by [`mdast-util-to-hast`][github-mdast-util-to-hast].

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+), install with [npm][npmjs-install]:

```sh
npm install mdast-util-gfm-autolink-literal
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {gfmAutolinkLiteralFromMarkdown, gfmAutolinkLiteralToMarkdown} from 'https://esm.sh/mdast-util-gfm-autolink-literal@2?bundle'
</script>
```

## Use

Say our document `example.md` contains:

```markdown
www.example.com, https://example.com, and contact@example.com.
```

…and our module `example.js` looks as follows:

```js
import fs from 'node:fs/promises'
import {gfmAutolinkLiteral} from 'micromark-extension-gfm-autolink-literal'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown
} from 'mdast-util-gfm-autolink-literal'
import {toMarkdown} from 'mdast-util-to-markdown'

const document = await fs.readFile('example.md', 'utf8')

const tree = fromMarkdown(document, {
  extensions: [gfmAutolinkLiteral()],
  mdastExtensions: [gfmAutolinkLiteralFromMarkdown()]
})

console.log(tree)

const out = toMarkdown(tree, {extensions: [gfmAutolinkLiteralToMarkdown()]})

console.log(out)
```

…now running `node example.js` yields (positional info removed for brevity):

```js
{
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          title: null,
          url: 'http://www.example.com',
          children: [{type: 'text', value: 'www.example.com'}]
        },
        {type: 'text', value: ', '},
        {
          type: 'link',
          title: null,
          url: 'https://example.com',
          children: [{type: 'text', value: 'https://example.com'}]
        },
        {type: 'text', value: ', and '},
        {
          type: 'link',
          title: null,
          url: 'mailto:contact@example.com',
          children: [{type: 'text', value: 'contact@example.com'}]
        },
        {type: 'text', value: '.'}
      ]
    }
  ]
}
```

```markdown
[www.example.com](http://www.example.com), <https://example.com>, and <contact@example.com>.
```

## API

This package exports the identifiers
[`gfmAutolinkLiteralFromMarkdown`][api-gfm-autolink-literal-from-markdown] and
[`gfmAutolinkLiteralToMarkdown`][api-gfm-autolink-literal-to-markdown].
There is no default export.

### `gfmAutolinkLiteralFromMarkdown()`

Create an extension for
[`mdast-util-from-markdown`][github-mdast-util-from-markdown]
to enable GFM autolink literals in markdown.

###### Returns

Extension for `mdast-util-to-markdown` to enable GFM autolink literals
([`FromMarkdownExtension`][github-mdast-util-from-markdown-extension]).

### `gfmAutolinkLiteralToMarkdown()`

Create an extension for
[`mdast-util-to-markdown`][github-mdast-util-to-markdown]
to enable GFM autolink literals in markdown.

###### Returns

Extension for `mdast-util-to-markdown` to enable GFM autolink literals
([`ToMarkdownExtension`][github-mdast-util-to-markdown-options]).

## HTML

This utility does not handle how markdown is turned to HTML.
That’s done by [`mdast-util-to-hast`][github-mdast-util-to-hast].

## Syntax

See [Syntax in
`micromark-extension-gfm-autolink-literal`][github-micromark-extension-syntax].

## Syntax tree

There are no interfaces added to **[mdast][github-mdast]** by this utility,
as it reuses the existing **[Link][github-mdast-link]** interface.

## Types

This package is fully typed with [TypeScript][].
It does not export additional types.

The `Link` type of the mdast nodes is exposed from `@types/mdast`.

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line,
`mdast-util-gfm-autolink-literal@^2`, compatible with Node.js 16.

This utility works with `mdast-util-from-markdown` version 2+ and
`mdast-util-to-markdown` version 2+.

## Related

* [`remark-gfm`][github-remark-gfm]
  — remark plugin to support GFM
* [`mdast-util-gfm`][github-mdast-util-gfm]
  — same but all of GFM (autolink literals, footnotes, strikethrough, tables,
  tasklists)
* [`micromark-extension-gfm-autolink-literal`][github-micromark-extension]
  — micromark extension to parse GFM autolink literals

## Contribute

See
[`contributing.md`][health-contributing]
in
[`syntax-tree/.github`][health]
for ways to get started.
See [`support.md`][health-support] for ways to get help.

This project has a [code of conduct][health-coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][file-license] © [Titus Wormer][wooorm]

<!-- Definitions -->

[api-gfm-autolink-literal-from-markdown]: #gfmautolinkliteralfrommarkdown

[api-gfm-autolink-literal-to-markdown]: #gfmautolinkliteraltomarkdown

[badge-build-image]: https://github.com/syntax-tree/mdast-util-gfm-autolink-literal/workflows/main/badge.svg

[badge-build-url]: https://github.com/syntax-tree/mdast-util-gfm-autolink-literal/actions

[badge-coverage-image]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-gfm-autolink-literal.svg

[badge-coverage-url]: https://codecov.io/github/syntax-tree/mdast-util-gfm-autolink-literal

[badge-downloads-image]: https://img.shields.io/npm/dm/mdast-util-gfm-autolink-literal.svg

[badge-downloads-url]: https://www.npmjs.com/package/mdast-util-gfm-autolink-literal

[badge-size-image]: https://img.shields.io/bundlejs/size/mdast-util-gfm-autolink-literal

[badge-size-url]: https://bundlejs.com/?q=mdast-util-gfm-autolink-literal

[esmsh]: https://esm.sh

[file-license]: license

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-mdast]: https://github.com/syntax-tree/mdast

[github-mdast-link]: https://github.com/syntax-tree/mdast#link

[github-mdast-util-from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[github-mdast-util-from-markdown-extension]: https://github.com/syntax-tree/mdast-util-from-markdown#extension

[github-mdast-util-gfm]: https://github.com/syntax-tree/mdast-util-gfm

[github-mdast-util-to-hast]: https://github.com/syntax-tree/mdast-util-to-hast

[github-mdast-util-to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[github-mdast-util-to-markdown-options]: https://github.com/syntax-tree/mdast-util-to-markdown#options

[github-micromark]: https://github.com/micromark/micromark

[github-micromark-extension]: https://github.com/micromark/micromark-extension-gfm-autolink-literal

[github-micromark-extension-syntax]: https://github.com/micromark/micromark-extension-gfm-autolink-literal#syntax

[github-remark-gfm]: https://github.com/remarkjs/remark-gfm

[health]: https://github.com/syntax-tree/.github

[health-coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[health-contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[health-support]: https://github.com/syntax-tree/.github/blob/main/support.md

[npmjs-install]: https://docs.npmjs.com/cli/install

[spec-gfm]: https://github.github.com/gfm/

[typescript]: https://www.typescriptlang.org

[wooorm]: https://wooorm.com
