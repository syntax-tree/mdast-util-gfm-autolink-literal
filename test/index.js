import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {toHtml} from 'hast-util-to-html'
import {toHast} from 'mdast-util-to-hast'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown
} from 'mdast-util-gfm-autolink-literal'
import {toMarkdown} from 'mdast-util-to-markdown'
import {gfmAutolinkLiteral} from 'micromark-extension-gfm-autolink-literal'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('mdast-util-gfm-autolink-literal')).sort(),
      ['gfmAutolinkLiteralFromMarkdown', 'gfmAutolinkLiteralToMarkdown']
    )
  })
})

test('gfmAutolinkLiteralFromMarkdown()', async function (t) {
  await t.test('should support autolink literals', async function () {
    assert.deepEqual(
      fromMarkdown(
        'www.example.com, https://example.com, and contact@example.com.',
        {
          extensions: [gfmAutolinkLiteral()],
          mdastExtensions: [gfmAutolinkLiteralFromMarkdown()]
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
      }
    )
  })

  await t.test('should support normal links', async function () {
    assert.deepEqual(
      fromMarkdown('[https://google.com](https://google.com)', {
        extensions: [gfmAutolinkLiteral()],
        mdastExtensions: [gfmAutolinkLiteralFromMarkdown()]
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
      }
    )
  })
})

test('gfmAutolinkLiteralToMarkdown()', async function (t) {
  await t.test('should not serialize autolink literals', async function () {
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
        {extensions: [gfmAutolinkLiteralToMarkdown()]}
      ),
      'a <contact@example.com> c.\n'
    )
  })

  await t.test(
    'should escape at signs if they appear in what looks like an email',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a b@c.d'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'a b\\@c.d\n'
      )
    }
  )

  await t.test(
    'should not escape at signs if they appear in what can’t be an email',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a @c'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'a @c\n'
      )
    }
  )

  await t.test(
    'should escape dots if they appear in what looks like a domain',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a www.b.c'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'a www\\.b.c\n'
      )
    }
  )

  await t.test(
    'should not escape dots if they appear in what can’t be a domain',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a.b'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'a.b\n'
      )
    }
  )

  await t.test(
    'should escape colons if they appear in what looks like a http protocol',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'https:/'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'https\\:/\n'
      )
    }
  )

  await t.test(
    'should not escape colons if they appear in what can’t be a http protocol',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'https:a'}]},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        'https:a\n'
      )
    }
  )

  await t.test(
    'should not escape colons in definition labels',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'definition', label: 'http://a', identifier: '', url: ''},
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '[http://a]: <>\n'
      )
    }
  )

  await t.test(
    'should not escape colons in link (reference) labels (shortcut)',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '[http://a][]\n'
      )
    }
  )

  await t.test(
    'should not escape colons in link (reference) labels (text)',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '[http://a][a]\n'
      )
    }
  )

  await t.test(
    'should not escape colons in link (reference) labels (label)',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '[a][http://a]\n'
      )
    }
  )

  await t.test(
    'should not escape colons in link (resource) labels',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '[a](http://a)\n'
      )
    }
  )

  await t.test(
    'should not escape colons in image (reference) labels (label)',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '![a][http://a]\n'
      )
    }
  )

  await t.test(
    'should not escape colons in image (reference) labels (alt)',
    async function () {
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
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '![http://a][a]\n'
      )
    }
  )

  await t.test(
    'should not escape colons in image (resource) labels',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'paragraph',
            children: [{type: 'image', url: 'http://a', alt: 'a'}]
          },
          {extensions: [gfmAutolinkLiteralToMarkdown()]}
        ),
        '![a](http://a)\n'
      )
    }
  )
})

test('fixtures', async function (t) {
  const root = new URL('fixture/', import.meta.url)

  const files = await fs.readdir(root)
  let index = -1

  while (++index < files.length) {
    const file = files[index]

    if (!/\.md$/.test(file)) continue

    const stem = file.split('.').slice(0, -1).join('.')

    await t.test('should work on `' + stem + '`', async function () {
      const inputUrl = new URL(file, root)
      const expectedUrl = new URL(stem + '.html', root)

      const input = await fs.readFile(inputUrl)
      const expected = String(await fs.readFile(expectedUrl))

      const mdast = fromMarkdown(input, {
        extensions: [gfmAutolinkLiteral()],
        mdastExtensions: [gfmAutolinkLiteralFromMarkdown()]
      })

      const hast = toHast(mdast, {allowDangerousHtml: true})
      assert(hast && hast.type === 'root', 'expected root')

      // @ts-expect-error: to do, remove when `to-html` is released.
      let actual = toHtml(hast, {
        allowDangerousHtml: true,
        entities: {useNamedReferences: true}
      })

      if (actual.charCodeAt(actual.length - 1) !== 10) {
        actual += '\n'
      }

      assert.deepEqual(actual, expected)
    })
  }
})
