var test = require('tape')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var syntax = require('micromark-extension-gfm-autolink-literal')
var autolinkLiterals = require('.')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown(
      'www.example.com, https://example.com, and contact@example.com.',
      {
        extensions: [syntax],
        mdastExtensions: [autolinkLiterals.fromMarkdown]
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

  t.deepEqual(
    fromMarkdown(
      `[http://localhost]: http://localhost "Open example on localhost"
[https://dev.local]: https://dev.local "Open example on localhost"

Existing link [http://localhost][], [https://dev.local][] in paragraph.`,
      {
        extensions: [syntax],
        mdastExtensions: [autolinkLiterals.fromMarkdown]
      }
    ),
    {
      type: 'root',
      children: [
        {
          type: 'definition',
          identifier: 'http://localhost',
          label: 'http://localhost',
          title: 'Open example on localhost',
          url: 'http://localhost',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 65, offset: 64}
          }
        },
        {
          type: 'definition',
          identifier: 'https://dev.local',
          label: 'https://dev.local',
          title: 'Open example on localhost',
          url: 'https://dev.local',
          position: {
            start: {line: 2, column: 1, offset: 65},
            end: {line: 2, column: 67, offset: 131}
          }
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Existing link ',
              position: {
                start: {line: 4, column: 1, offset: 133},
                end: {line: 4, column: 15, offset: 147}
              }
            },
            {
              type: 'linkReference',
              children: [
                {
                  type: 'text',
                  value: 'http://localhost',
                  position: {
                    start: {line: 4, column: 16, offset: 148},
                    end: {line: 4, column: 32, offset: 164}
                  }
                }
              ],
              position: {
                start: {line: 4, column: 15, offset: 147},
                end: {line: 4, column: 35, offset: 167}
              },
              identifier: 'http://localhost',
              label: 'http://localhost',
              referenceType: 'collapsed'
            },
            {
              type: 'text',
              value: ', ',
              position: {
                start: {line: 4, column: 35, offset: 167},
                end: {line: 4, column: 37, offset: 169}
              }
            },
            {
              type: 'linkReference',
              children: [
                {
                  type: 'text',
                  value: 'https://dev.local',
                  position: {
                    start: {line: 4, column: 38, offset: 170},
                    end: {line: 4, column: 55, offset: 187}
                  }
                }
              ],
              position: {
                start: {line: 4, column: 37, offset: 169},
                end: {line: 4, column: 58, offset: 190}
              },
              identifier: 'https://dev.local',
              label: 'https://dev.local',
              referenceType: 'collapsed'
            },
            {
              type: 'text',
              value: ' in paragraph.',
              position: {
                start: {line: 4, column: 58, offset: 190},
                end: {line: 4, column: 72, offset: 204}
              }
            }
          ],
          position: {
            start: {line: 4, column: 1, offset: 133},
            end: {line: 4, column: 72, offset: 204}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 4, column: 72, offset: 204}
      }
    },
    'should support existing link references with identifier as label'
  )

  t.end()
})

test('mdast -> markdown', function (t) {
  t.deepEqual(
    toMarkdown(
      {
        type: 'root',
        children: [
          {
            type: 'definition',
            identifier: 'http://localhost',
            label: 'http://localhost',
            title: 'Open example on localhost',
            url: 'http://localhost',
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {line: 1, column: 65, offset: 64}
            }
          },
          {
            type: 'definition',
            identifier: 'https://dev.local',
            label: 'https://dev.local',
            title: 'Open example on localhost',
            url: 'https://dev.local',
            position: {
              start: {line: 2, column: 1, offset: 65},
              end: {line: 2, column: 67, offset: 131}
            }
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Existing link ',
                position: {
                  start: {line: 4, column: 1, offset: 133},
                  end: {line: 4, column: 15, offset: 147}
                }
              },
              {
                type: 'linkReference',
                children: [
                  {
                    type: 'text',
                    value: 'http://localhost',
                    position: {
                      start: {line: 4, column: 16, offset: 148},
                      end: {line: 4, column: 32, offset: 164}
                    }
                  }
                ],
                position: {
                  start: {line: 4, column: 15, offset: 147},
                  end: {line: 4, column: 35, offset: 167}
                },
                identifier: 'http://localhost',
                label: 'http://localhost',
                referenceType: 'collapsed'
              },
              {
                type: 'text',
                value: ', ',
                position: {
                  start: {line: 4, column: 35, offset: 167},
                  end: {line: 4, column: 37, offset: 169}
                }
              },
              {
                type: 'linkReference',
                children: [
                  {
                    type: 'text',
                    value: 'https://dev.local',
                    position: {
                      start: {line: 4, column: 38, offset: 170},
                      end: {line: 4, column: 55, offset: 187}
                    }
                  }
                ],
                position: {
                  start: {line: 4, column: 37, offset: 169},
                  end: {line: 4, column: 58, offset: 190}
                },
                identifier: 'https://dev.local',
                label: 'https://dev.local',
                referenceType: 'collapsed'
              },
              {
                type: 'text',
                value: ' in paragraph.',
                position: {
                  start: {line: 4, column: 58, offset: 190},
                  end: {line: 4, column: 72, offset: 204}
                }
              }
            ],
            position: {
              start: {line: 4, column: 1, offset: 133},
              end: {line: 4, column: 72, offset: 204}
            }
          }
        ],
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 4, column: 72, offset: 204}
        }
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    `[http://localhost]: http://localhost "Open example on localhost"

[https://dev.local]: https://dev.local "Open example on localhost"

Existing link [http://localhost][], [https://dev.local][] in paragraph.
`,
    'should not escape existing link text.'
  )

  t.deepEqual(
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
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a <contact@example.com> c.\n',
    'should not serialize autolink literals'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a b@c.d'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a b\\@c.d\n',
    'should escape at signs if they appear in what looks like an email'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a @c'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a @c\n',
    'should not escape at signs if they appear in what can’t be an email'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a www.b.c'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a www\\.b.c\n',
    'should escape dots if they appear in what looks like a domain'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a.b'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a.b\n',
    'should not escape dots if they appear in what can’t be a domain'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'https:/'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'https\\:/\n',
    'should escape colons if they appear in what looks like a http protocol'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'https:a'}]},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'https:a\n',
    'should not escape colons if they appear in what can’t be a http protocol'
  )

  t.end()
})
