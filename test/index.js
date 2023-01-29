import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {toHtml} from 'hast-util-to-html'
import {toHast} from 'mdast-util-to-hast'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {gfmAutolinkLiteral} from 'micromark-extension-gfm-autolink-literal'
import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown
} from '../index.js'
import * as mod from '../index.js'

test('core', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['gfmAutolinkLiteralFromMarkdown', 'gfmAutolinkLiteralToMarkdown'],
    'should expose the public api'
  )
})

test('gfmAutolinkLiteralFromMarkdown', () => {
  assert.deepEqual(
    fromMarkdown(
      'www.example.com, https://example.com, and contact@example.com.',
      {
        extensions: [gfmAutolinkLiteral],
        mdastExtensions: [gfmAutolinkLiteralFromMarkdown]
      }
    ),
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
              children: [
                {
                  type: 'text',
                  value: 'www.example.com',
                  position: {
                    start: {line: 1, column: 1, offset: 0},
                    end: {line: 1, column: 16, offset: 15}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 16, offset: 15}
              }
            },
            {
              type: 'text',
              value: ', ',
              position: {
                start: {line: 1, column: 16, offset: 15},
                end: {line: 1, column: 18, offset: 17}
              }
            },
            {
              type: 'link',
              title: null,
              url: 'https://example.com',
              children: [
                {
                  type: 'text',
                  value: 'https://example.com',
                  position: {
                    start: {line: 1, column: 18, offset: 17},
                    end: {line: 1, column: 37, offset: 36}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 18, offset: 17},
                end: {line: 1, column: 37, offset: 36}
              }
            },
            {
              type: 'text',
              value: ', and ',
              position: {
                start: {line: 1, column: 37, offset: 36},
                end: {line: 1, column: 43, offset: 42}
              }
            },
            {
              type: 'link',
              title: null,
              url: 'mailto:contact@example.com',
              children: [
                {
                  type: 'text',
                  value: 'contact@example.com',
                  position: {
                    start: {line: 1, column: 43, offset: 42},
                    end: {line: 1, column: 62, offset: 61}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 43, offset: 42},
                end: {line: 1, column: 62, offset: 61}
              }
            },
            {
              type: 'text',
              value: '.',
              position: {
                start: {line: 1, column: 62, offset: 61},
                end: {line: 1, column: 63, offset: 62}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 63, offset: 62}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 63, offset: 62}
      }
    },
    'should support autolink literals'
  )

  assert.deepEqual(
    fromMarkdown('[https://google.com](https://google.com)', {
      extensions: [gfmAutolinkLiteral],
      mdastExtensions: [gfmAutolinkLiteralFromMarkdown]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              title: null,
              url: 'https://google.com',
              children: [
                {
                  type: 'text',
                  value: 'https://google.com',
                  position: {
                    start: {line: 1, column: 2, offset: 1},
                    end: {line: 1, column: 20, offset: 19}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 41, offset: 40}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 41, offset: 40}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 41, offset: 40}
      }
    },
    'should support normal links'
  )
})

test('gfmAutolinkLiteralToMarkdown', async () => {
  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a '},
          {
            type: 'link',
            title: null,
            url: 'mailto:contact@example.com',
            children: [{type: 'text', value: 'contact@example.com'}]
          },
          {type: 'text', value: ' c.'}
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'a <contact@example.com> c.\n',
    'should not serialize autolink literals'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a b@c.d'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'a b\\@c.d\n',
    'should escape at signs if they appear in what looks like an email'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a @c'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'a @c\n',
    'should not escape at signs if they appear in what can’t be an email'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a www.b.c'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'a www\\.b.c\n',
    'should escape dots if they appear in what looks like a domain'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a.b'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'a.b\n',
    'should not escape dots if they appear in what can’t be a domain'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'https:/'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'https\\:/\n',
    'should escape colons if they appear in what looks like a http protocol'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'https:a'}]},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    'https:a\n',
    'should not escape colons if they appear in what can’t be a http protocol'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'definition', label: 'http://a', identifier: '', url: ''},
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '[http://a]: <>\n',
    'should not escape colons in definition labels'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'http://a',
            identifier: '',
            referenceType: 'collapsed',
            children: [{type: 'text', value: 'http://a'}]
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '[http://a][]\n',
    'should not escape colons in link (reference) labels (shortcut)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'a',
            identifier: '',
            referenceType: 'full',
            children: [{type: 'text', value: 'http://a'}]
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '[http://a][a]\n',
    'should not escape colons in link (reference) labels (text)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'http://a',
            identifier: '',
            referenceType: 'full',
            children: [{type: 'text', value: 'a'}]
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '[a][http://a]\n',
    'should not escape colons in link (reference) labels (label)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'http://a',
            children: [{type: 'text', value: 'a'}]
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '[a](http://a)\n',
    'should not escape colons in link (resource) labels'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'imageReference',
            label: 'http://a',
            identifier: '',
            referenceType: 'full',
            alt: 'a'
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '![a][http://a]\n',
    'should not escape colons in image (reference) labels (label)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'imageReference',
            label: 'a',
            identifier: '',
            referenceType: 'full',
            alt: 'http://a'
          }
        ]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '![http://a][a]\n',
    'should not escape colons in image (reference) labels (alt)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'image', url: 'http://a', alt: 'a'}]
      },
      {extensions: [gfmAutolinkLiteralToMarkdown]}
    ),
    '![a](http://a)\n',
    'should not escape colons in image (resource) labels'
  )

  const root = new URL('./', import.meta.url)

  const files = await fs.readdir(root)
  let index = -1

  while (++index < files.length) {
    const file = files[index]

    if (!/\.md$/.test(file)) continue

    const stem = file.split('.').slice(0, -1).join('.')
    const inputUrl = new URL(file, root)
    const expectedUrl = new URL(stem + '.html', root)

    const input = await fs.readFile(inputUrl)
    const expected = String(await fs.readFile(expectedUrl))

    const hast = toHast(
      fromMarkdown(input, {
        extensions: [gfmAutolinkLiteral],
        mdastExtensions: [gfmAutolinkLiteralFromMarkdown]
      }),
      {allowDangerousHtml: true}
    )
    assert(hast && hast.type === 'root', 'expected root')
    let actual = toHtml(hast, {
      allowDangerousHtml: true,
      entities: {useNamedReferences: true}
    })

    if (actual.charCodeAt(actual.length - 1) !== 10) {
      actual += '\n'
    }

    assert.deepEqual(actual, expected, stem)
  }
})
