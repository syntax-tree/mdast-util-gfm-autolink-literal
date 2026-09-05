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

  await t.test('should support protocol email literals', async function () {
    assert.deepEqual(
      compactLinks(
        'mailto:foo@bar.baz xmpp:foo@bar.baz/txt-bin_part ' +
          'xmpp:foo@bar.baz/txt/bin'
      ),
      [
        ['mailto:foo@bar.baz', 'mailto:foo@bar.baz'],
        ['xmpp:foo@bar.baz/txt-bin_part', 'xmpp:foo@bar.baz/txt-bin_part'],
        ['xmpp:foo@bar.baz/txt/bin', 'xmpp:foo@bar.baz/txt/bin']
      ]
    )
  })

  await t.test(
    'should match cmark-gfm protocol email boundaries',
    async function () {
      assert.deepEqual(
        compactLinks(
          'mailto:one@example.com/message ' +
            'mailto:one@example.com/mailto:two@example.com ' +
            'mmmmailto:three@example.com xmpp:four@example.com/message.'
        ),
        [
          ['mailto:one@example.com', 'mailto:one@example.com'],
          ['mailto:one@example.com', 'mailto:one@example.com'],
          ['mailto:two@example.com', 'mailto:two@example.com'],
          ['three@example.com', 'mailto:three@example.com'],
          ['xmpp:four@example.com/message', 'xmpp:four@example.com/message']
        ]
      )
    }
  )

  await t.test(
    'should include cmark-gfm atext before protocol names',
    async function () {
      assert.deepEqual(
        compactLinks(
          '_mailto:a@b.co +mailto:a@b.co -mailto:a@b.co .mailto:a@b.co ' +
            'x_mailto:a@b.co _xmpp:a@b.co/txt ' +
            '_mailto&#58;a&#64;b.co'
        ),
        [
          ['_mailto:a@b.co', '_mailto:a@b.co'],
          ['+mailto:a@b.co', '+mailto:a@b.co'],
          ['-mailto:a@b.co', '-mailto:a@b.co'],
          ['.mailto:a@b.co', '.mailto:a@b.co'],
          ['x_mailto:a@b.co', 'x_mailto:a@b.co'],
          ['_xmpp:a@b.co/txt', '_xmpp:a@b.co/txt'],
          ['_mailto:a@b.co', '_mailto:a@b.co']
        ]
      )
    }
  )

  await t.test(
    'should match cmark-gfm XMPP resource endings',
    async function () {
      assert.deepEqual(
        compactLinks(
          'xmpp:a@b.co/123 xmpp:a@b.co/part- xmpp:a@b.co/part_ ' +
            'xmpp:a@b.co/part/ xmpp:a@b.co/123. xmpp:a@b.co/part. ' +
            'xmpp:a@b.co/part...tail'
        ),
        [
          ['xmpp:a@b.co/part', 'xmpp:a@b.co/part'],
          ['xmpp:a@b.co/part', 'xmpp:a@b.co/part']
        ]
      )
    }
  )

  await t.test(
    'should restart email matching after an XMPP resource at-sign',
    async function () {
      assert.deepEqual(
        compactLinks(
          'xmpp:a@b.co/txt@bin xmpp:a@b.co/txt@bin.com ' +
            'xmpp:a@b.co/txt@bin. xmpp:a@b.co/txt@bin- ' +
            'xmpp:a@b.co/txt@bin/ xmpp:a@b.co/txt@bin/part ' +
            'xmpp:a@b.co/txt@bin@last.co ' +
            'xmpp\\:a@b.co/txt@bin xmpp&#58;a@b.co/txt@bin.com ' +
            'xmpp&#58;a&#64;b.co/txt&#64;bin.com. ' +
            'xmpp&#58;a&#64;b.co/txt&#64;bin/ ' +
            'xmpp&#58;a@b.co/txt@bin@last.co ' +
            'xmpp:a@b.co/one@two.co@three.co@four.co ' +
            'xmpp&#58;a&#64;b.co/one&#64;two.co&#64;three.co&#64;four.co ' +
            'xmpp:a@b.co/txt@bin..com ' +
            'xmpp&#58;a&#64;b.co/txt&#64;bin..com'
        ),
        [
          ['txt@bin', 'txt@bin'],
          ['txt@bin.com', 'txt@bin.com'],
          ['txt@bin', 'txt@bin'],
          ['txt@bin/part', 'txt@bin/part'],
          ['bin@last.co', 'bin@last.co'],
          ['txt@bin', 'txt@bin'],
          ['txt@bin.com', 'txt@bin.com'],
          ['txt@bin.com', 'txt@bin.com'],
          ['bin@last.co', 'bin@last.co'],
          ['three.co@four.co', 'three.co@four.co'],
          ['three.co@four.co', 'three.co@four.co'],
          ['txt@bin', 'txt@bin'],
          ['txt@bin', 'txt@bin']
        ]
      )
    }
  )

  await t.test(
    'should match cmark-gfm repeated-at and domain validation',
    async function () {
      assert.deepEqual(
        compactLinks(
          'mailto:a@b@c.de xmpp:a@b@c.de ' +
            'xmpp:a@b.co/one@two.co@bad- ' +
            'mailto:a@b.-co xmpp:a@b._co/path mailto:a@b.c.-d ' +
            'mailto:@b.co xmpp:@b.co/path xmpp:a@b/path.co'
        ),
        [
          ['b@c.de', 'b@c.de'],
          ['b@c.de', 'b@c.de'],
          ['mailto:a@b.c', 'mailto:a@b.c'],
          ['mailto:@b.co', 'mailto:@b.co'],
          ['xmpp:@b.co/path', 'xmpp:@b.co/path'],
          ['xmpp:a@b/path.co', 'xmpp:a@b/path.co']
        ]
      )

      assert.deepEqual(
        compactLinks(
          'mailto&#58;a&#64;b&#64;c.de ' +
            'xmpp&#58;a&#64;b&#64;c.de ' +
            'xmpp&#58;a&#64;b.co/one&#64;two.co&#64;bad- ' +
            'mailto&#58;&#64;b.co xmpp&#58;&#64;b.co/path'
        ),
        [
          ['b@c.de', 'b@c.de'],
          ['b@c.de', 'b@c.de'],
          ['mailto:@b.co', 'mailto:@b.co'],
          ['xmpp:@b.co/path', 'xmpp:@b.co/path']
        ]
      )

      assert.deepEqual(compactLinks('a@b- mailto:c@d.co mailto:a@@b.co'), [
        ['mailto:c@d.co', 'mailto:c@d.co']
      ])
    }
  )

  await t.test(
    'should preserve XMPP restart prefixes and positions',
    async function () {
      assert.deepEqual(compactChildren('xmpp:a@b.co/txt@bin.'), [
        {
          type: 'text',
          value: 'xmpp:',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 6, offset: 5}
          }
        },
        {
          type: 'text',
          value: 'a@b.co',
          position: {
            start: {line: 1, column: 6, offset: 5},
            end: {line: 1, column: 12, offset: 11}
          }
        },
        {
          type: 'text',
          value: '/',
          position: {
            start: {line: 1, column: 12, offset: 11},
            end: {line: 1, column: 13, offset: 12}
          }
        },
        {
          type: 'link',
          value: 'txt@bin',
          url: 'txt@bin',
          position: {
            start: {line: 1, column: 13, offset: 12},
            end: {line: 1, column: 20, offset: 19}
          },
          childPosition: {
            start: {line: 1, column: 13, offset: 12},
            end: {line: 1, column: 20, offset: 19}
          }
        },
        {
          type: 'text',
          value: '.',
          position: {
            start: {line: 1, column: 20, offset: 19},
            end: {line: 1, column: 21, offset: 20}
          }
        }
      ])
      assert.deepEqual(
        compactChildren('xmpp&#58;a&#64;b.co/txt&#64;bin.com.'),
        [
          {type: 'text', value: 'xmpp:a@b.co/', position: undefined},
          {
            type: 'link',
            value: 'txt@bin.com',
            url: 'txt@bin.com',
            position: undefined,
            childPosition: undefined
          },
          {type: 'text', value: '.', position: undefined}
        ]
      )
    }
  )

  await t.test(
    'should support decoded protocol email literals',
    async function () {
      assert.deepEqual(
        compactLinks(
          'mailto\\:foo@bar.baz mailto&#58;bar@baz.qux ' +
            'mailto:entity&#64;example.com xmpp\\:one@example.com ' +
            'xmpp:two&#64;example.com/txt/bin ' +
            'xmpp:three&#64;example.com/123. ' +
            'xmpp:four&#64;example.com/part- ' +
            'xmpp:five&#64;example.com/part...tail'
        ),
        [
          ['mailto:foo@bar.baz', 'mailto:foo@bar.baz'],
          ['mailto:bar@baz.qux', 'mailto:bar@baz.qux'],
          ['mailto:entity@example.com', 'mailto:entity@example.com'],
          ['xmpp:one@example.com', 'xmpp:one@example.com'],
          ['xmpp:two@example.com/txt/bin', 'xmpp:two@example.com/txt/bin'],
          ['xmpp:five@example.com/part', 'xmpp:five@example.com/part']
        ]
      )

      const paragraph = firstParagraph('xmpp\\:one@example.com/part.')
      const trailing = paragraph.children[1]

      assert(trailing)
      assert.equal(trailing.type, 'text')
      assert.equal(trailing.value, '.')

      const invalid = firstParagraph('xmpp:four&#64;example.com/part-')

      assert.deepEqual(compactLinks('xmpp:four&#64;example.com/part-'), [])
      assert.equal(invalid.children.length, 1)
      assert.equal(invalid.children[0].type, 'text')
      assert.equal(invalid.children[0].value, 'xmpp:four@example.com/part-')
    }
  )

  await t.test(
    'should preserve the bare-email fallback after invalid protocols',
    async function () {
      assert.deepEqual(
        compactLinks(
          'xmailto:foo@bar.baz MAILTO:bar@baz.qux ' +
            'mailto:a.b-c_d@a.b- mailto:a.b-c_d@a.b_'
        ),
        [
          ['foo@bar.baz', 'mailto:foo@bar.baz'],
          ['bar@baz.qux', 'mailto:bar@baz.qux']
        ]
      )
    }
  )

  await t.test(
    'should not absorb explicit or angle email links',
    async function () {
      assert.deepEqual(
        compactLinks(
          'mailto:[foo@bar.baz](mailto:foo@bar.baz) mailto:<bar@baz.qux>'
        ),
        [
          ['foo@bar.baz', 'mailto:foo@bar.baz'],
          ['bar@baz.qux', 'mailto:bar@baz.qux']
        ]
      )
    }
  )

  await t.test(
    'should preserve positions for raw protocol email literals',
    async function () {
      const paragraph = firstParagraph('prefix mailto:foo@bar.baz suffix')
      const link = paragraph.children[1]

      assert(link)
      assert.equal(link.type, 'link')
      assert.deepEqual(link.position, {
        start: {line: 1, column: 8, offset: 7},
        end: {line: 1, column: 26, offset: 25}
      })
      assert.deepEqual(link.children[0].position, link.position)

      const multiline = firstParagraph('prefix\nmailto:foo@bar.baz')
      const multilineLink = multiline.children[1]

      assert(multilineLink)
      assert.equal(multilineLink.type, 'link')
      assert.deepEqual(multilineLink.position, {
        start: {line: 2, column: 1, offset: 7},
        end: {line: 2, column: 19, offset: 25}
      })

      for (const [ending, start, end] of [
        ['\r', 7, 25],
        ['\r\n', 8, 26]
      ]) {
        const crParagraph = firstParagraph(
          'prefix' + ending + 'mailto:foo@bar.baz'
        )
        const crLink = crParagraph.children[1]

        assert(crLink)
        assert.equal(crLink.type, 'link')
        assert.deepEqual(crLink.position, {
          start: {line: 2, column: 1, offset: start},
          end: {line: 2, column: 19, offset: end}
        })
      }
    }
  )

  await t.test(
    'should preserve empty-atext text after a protocol link',
    async function () {
      assert.deepEqual(compactLinks('mailto:a@b.co @c.de'), [
        ['mailto:a@b.co', 'mailto:a@b.co']
      ])
    }
  )

  await t.test(
    'should not change unrelated bare-email boundaries',
    async function () {
      assert.deepEqual(compactLinks('mailto:a@b.co /c@d.ef'), [
        ['mailto:a@b.co', 'mailto:a@b.co']
      ])
    }
  )

  await t.test(
    'should preserve positions outside decoded source spans',
    async function () {
      const paragraph = firstParagraph('mailto:foo@bar.baz &amp;')
      const link = paragraph.children[0]

      assert(link)
      assert.equal(link.type, 'link')
      assert.deepEqual(link.position, {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 19, offset: 18}
      })
    }
  )

  await t.test(
    'should not reinterpret links from earlier transforms',
    async function () {
      const extension = gfmAutolinkLiteralFromMarkdown()
      const transform = extension.transforms && extension.transforms[0]
      /** @type {import('mdast').Link} */
      const existing = {
        type: 'link',
        title: null,
        url: 'mailto:a@b.co',
        children: [{type: 'text', value: 'a@b.co'}]
      }
      /** @type {import('mdast').Root} */
      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{type: 'text', value: 'xmpp:'}, existing]
          }
        ]
      }

      assert(transform)
      transform(tree)
      const paragraph = tree.children[0]

      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      assert.equal(paragraph.children[1], existing)

      const positioned = {
        ...existing,
        children: [
          {
            type: /** @type {const} */ ('text'),
            value: 'a@b.co',
            position: {
              start: {line: 1, column: 6, offset: 5},
              end: {line: 1, column: 12, offset: 11}
            }
          }
        ],
        position: {
          start: {line: 1, column: 6, offset: 5},
          end: {line: 1, column: 12, offset: 11}
        }
      }
      /** @type {import('mdast').Root} */
      const positionedTree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'xmpp:',
                position: {
                  start: {line: 1, column: 1, offset: 0},
                  end: {line: 1, column: 6, offset: 5}
                }
              },
              positioned
            ]
          }
        ]
      }

      transform(positionedTree)
      const positionedParagraph = positionedTree.children[0]

      assert(positionedParagraph)
      assert.equal(positionedParagraph.type, 'paragraph')
      assert.equal(positionedParagraph.children[1], positioned)
    }
  )

  await t.test(
    'should respect literal email edits from earlier transforms',
    async function () {
      const tree = fromMarkdown('a@b.co c@d.ef', {
        extensions: [gfmAutolinkLiteral()],
        mdastExtensions: [
          {
            transforms: [
              function (tree) {
                const paragraph = tree.children[0]
                assert(paragraph)
                assert.equal(paragraph.type, 'paragraph')
                const first = paragraph.children[0]
                const last = paragraph.children[2]
                assert(first)
                assert(last)
                assert.equal(first.type, 'link')
                assert.equal(last.type, 'link')
                first.url = 'https://example.org/contact'
                last.url = 'mailto:mailto:c@d.ef'
                last.children = [{type: 'text', value: 'mailto:c@d.ef'}]
                last.position = undefined
              }
            ]
          },
          gfmAutolinkLiteralFromMarkdown()
        ]
      })
      const paragraph = tree.children[0]
      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      const first = paragraph.children[0]
      const last = paragraph.children[2]
      assert(first)
      assert(last)
      assert.equal(first.type, 'link')
      assert.equal(last.type, 'link')
      assert.equal(first.url, 'https://example.org/contact')
      assert.equal(last.url, 'mailto:c@d.ef')
      assert.equal(last.position, undefined)
    }
  )

  await t.test(
    'should preserve malformed protocol text nodes',
    async function () {
      const extension = gfmAutolinkLiteralFromMarkdown()
      const transform = extension.transforms && extension.transforms[0]
      /** @type {import('mdast').Text} */
      const original = {
        type: 'text',
        value: 'mailto:a@b',
        data: /** @type {import('mdast').TextData} */ ({custom: true}),
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 11, offset: 10}
        }
      }
      /** @type {import('mdast').Root} */
      const tree = {
        type: 'root',
        children: [{type: 'paragraph', children: [original]}]
      }

      assert(transform)
      transform(tree)
      const paragraph = tree.children[0]

      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      assert.equal(paragraph.children[0], original)
    }
  )

  await t.test(
    'should preserve empty text nodes at protocol boundaries',
    async function () {
      const extension = gfmAutolinkLiteralFromMarkdown()
      const transform = extension.transforms && extension.transforms[0]
      /** @type {import('mdast').Text} */
      const empty = {
        type: 'text',
        value: '',
        data: /** @type {import('mdast').TextData} */ ({custom: true})
      }
      /** @type {import('mdast').Root} */
      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [empty, {type: 'text', value: 'mailto:@b.co'}]
          }
        ]
      }

      assert(transform)
      transform(tree)
      const paragraph = tree.children[0]

      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      assert.equal(paragraph.children[0], empty)
      assert.equal(paragraph.children[1].type, 'link')
      assert.equal(paragraph.children[1].url, 'mailto:@b.co')
    }
  )

  await t.test(
    'should preserve complete fallback URLs containing emails and protocols',
    async function () {
      assert.deepEqual(
        compactLinks(
          'https&#58;//example.org?mail=a&#64;b.co https&#58;//example.org?to=mailto:a&#64;b.co ' +
            'https&#58;//example.org?one=mailto:a&#64;b.co&two=xmpp:c&#64;d.ef.'
        ),
        [
          [
            'https://example.org?mail=a@b.co',
            'https://example.org?mail=a@b.co'
          ],
          [
            'https://example.org?to=mailto:a@b.co',
            'https://example.org?to=mailto:a@b.co'
          ],
          [
            'https://example.org?one=mailto:a@b.co&two=xmpp:c@d.ef',
            'https://example.org?one=mailto:a@b.co&two=xmpp:c@d.ef'
          ]
        ]
      )
    }
  )

  await t.test(
    'should preserve text containing a partial malformed protocol',
    async function () {
      const extension = gfmAutolinkLiteralFromMarkdown()
      const transform = extension.transforms && extension.transforms[0]
      /** @type {import('mdast').Text} */
      const original = {
        type: 'text',
        value: 'prefix mailto:a@b suffix',
        data: /** @type {import('mdast').TextData} */ ({custom: true}),
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 25, offset: 24}
        }
      }
      /** @type {import('mdast').Root} */
      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [original, {type: 'text', value: ' mailto:a@b.co'}]
          }
        ]
      }
      assert(transform)
      transform(tree)
      const paragraph = tree.children[0]
      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      assert.equal(paragraph.children[0], original)
    }
  )

  await t.test(
    'should recognize XMPP resources before fallback URLs',
    async function () {
      assert.deepEqual(
        compactLinks(
          'xmpp:a@b.co/www.example.org ' +
            'xmpp:a&#64;www.example.org/path ' +
            'xmpp&#58;a&#64;b.co/www.example.org ' +
            'xmpp:a&#64;b.co/www.example.org/123 www.example.com'
        ),
        [
          ['xmpp:a@b.co/www.example.org', 'xmpp:a@b.co/www.example.org'],
          ['xmpp:a@www.example.org/path', 'xmpp:a@www.example.org/path'],
          ['xmpp:a@b.co/www.example.org', 'xmpp:a@b.co/www.example.org'],
          ['www.example.com', 'http://www.example.com']
        ]
      )
    }
  )

  await t.test(
    'should skip fallback matching inside rejected protocol resources',
    async function (t) {
      const extension = gfmAutolinkLiteralFromMarkdown()
      const transform = extension.transforms && extension.transforms[0]
      const value = 'xmpp:a@b.co/' + 'www.example.org/'.repeat(256) + '123'
      /** @type {import('mdast').Text} */
      const original = {type: 'text', value}
      /** @type {import('mdast').Root} */
      const tree = {
        type: 'root',
        children: [{type: 'paragraph', children: [original]}]
      }
      const exec = RegExp.prototype.exec
      let fallbackMatches = 0

      const mocked = t.mock.method(
        RegExp.prototype,
        'exec',
        /** @this {RegExp} @param {string} input */ function (input) {
          if (this.source.startsWith('(https?')) fallbackMatches++
          return exec.call(this, input)
        }
      )

      try {
        assert(transform)
        transform(tree)
      } finally {
        mocked.mock.restore()
      }

      assert.equal(fallbackMatches, 0)
      const paragraph = tree.children[0]
      assert(paragraph)
      assert.equal(paragraph.type, 'paragraph')
      assert.equal(paragraph.children.length, 1)
      assert.equal(paragraph.children[0], original)
    }
  )

  await t.test(
    'should only join source-adjacent protocol fragments',
    async function () {
      for (const [prefixValue, suffixValue] of [
        ['xmpp:a', '@b.co/path'],
        ['xmpp:', 'a@b.co/path']
      ]) {
        for (const gap of [0, 1]) {
          const extension = gfmAutolinkLiteralFromMarkdown()
          const transform = extension.transforms && extension.transforms[0]
          /** @type {import('mdast').Text} */
          const prefix = {
            type: 'text',
            value: prefixValue,
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {
                line: 1,
                column: prefixValue.length + 1,
                offset: prefixValue.length
              }
            }
          }
          /** @type {import('mdast').Text} */
          const suffix = {
            type: 'text',
            value: suffixValue,
            position: {
              start: {
                line: 1,
                column: prefixValue.length + 1 + gap,
                offset: prefixValue.length + gap
              },
              end: {line: 1, column: 17 + gap, offset: 16 + gap}
            }
          }
          /** @type {import('mdast').Root} */
          const tree = {
            type: 'root',
            children: [{type: 'paragraph', children: [prefix, suffix]}]
          }

          assert(transform)
          transform(tree)
          const paragraph = tree.children[0]

          assert(paragraph)
          assert.equal(paragraph.type, 'paragraph')

          if (gap) {
            assert.equal(paragraph.children[0], prefix)
            assert.deepEqual(
              paragraph.children
                .filter(function (node) {
                  return node.type === 'link'
                })
                .map(function (node) {
                  return node.url
                }),
              suffixValue.startsWith('@') ? [] : ['mailto:a@b.co']
            )
          } else {
            assert.equal(paragraph.children.length, 1)
            assert.equal(paragraph.children[0].type, 'link')
            assert.equal(paragraph.children[0].url, 'xmpp:a@b.co/path')
            assert.deepEqual(paragraph.children[0].position, {
              start: prefix.position && prefix.position.start,
              end: suffix.position && suffix.position.end
            })
          }
        }
      }
    }
  )

  await t.test(
    'should omit positions when decoded source widths differ',
    async function () {
      const paragraph = firstParagraph('mailto\\:foo@bar.baz')
      const link = paragraph.children[0]

      assert(link)
      assert.equal(link.type, 'link')
      assert.equal(link.position, undefined)
      assert.equal(link.children[0].position, undefined)
    }
  )
})

/**
 * @param {string} value
 *   Markdown.
 * @returns {import('mdast').Paragraph}
 *   First paragraph.
 */
function firstParagraph(value) {
  const tree = fromMarkdown(value, {
    extensions: [gfmAutolinkLiteral()],
    mdastExtensions: [gfmAutolinkLiteralFromMarkdown()]
  })
  const paragraph = tree.children[0]

  assert(paragraph)
  assert.equal(paragraph.type, 'paragraph')
  return paragraph
}

/**
 * @param {string} value
 *   Markdown.
 * @returns {Array<[string, string]>}
 *   Link text and URLs.
 */
function compactLinks(value) {
  const paragraph = firstParagraph(value)
  /** @type {Array<[string, string]>} */
  const result = []

  for (const child of paragraph.children) {
    if (child.type === 'link') {
      const text = child.children[0]
      assert(text)
      assert.equal(text.type, 'text')
      result.push([text.value, child.url])
    }
  }

  return result
}

/**
 * @param {string} value
 *   Markdown.
 * @returns {Array<
 *   | {type: 'text', value: string, position: import('unist').Position | undefined}
 *   | {type: 'link', value: string, url: string, position: import('unist').Position | undefined, childPosition: import('unist').Position | undefined}
 * >}
 *   Compact children with source ranges.
 */
function compactChildren(value) {
  const paragraph = firstParagraph(value)

  return paragraph.children.map(function (child) {
    if (child.type === 'link') {
      const text = child.children[0]

      assert(text)
      assert.equal(text.type, 'text')
      return {
        type: 'link',
        value: text.value,
        url: child.url,
        position: child.position,
        childPosition: text.position
      }
    }

    assert.equal(child.type, 'text')
    return {type: 'text', value: child.value, position: child.position}
  })
}

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

      let actual = toHtml(hast, {
        allowDangerousHtml: true,
        characterReferences: {useNamedReferences: true}
      })

      if (actual.charCodeAt(actual.length - 1) !== 10) {
        actual += '\n'
      }

      assert.deepEqual(actual, expected)
    })
  }
})
