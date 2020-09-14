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

  t.end()
})

test('mdast -> markdown', function (t) {
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
    'a <contact@example.com> c.',
    'should not serialize autolink literals'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'a b@c.d'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a b\\@c.d',
    'should escape at signs if they appear in what looks like an email'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'a @c'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a @c',
    'should not escape at signs if they appear in what can’t be an email'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'a www.b.c'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a www\\.b.c',
    'should escape dots if they appear in what looks like a domain'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'a.b'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'a.b',
    'should not escape dots if they appear in what can’t be a domain'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'https:/'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'https\\:/',
    'should escape colons if they appear in what looks like a http protocol'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'text', value: 'https:a'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    'https:a',
    'should not escape colons if they appear in what can’t be a http protocol'
  )

  t.end()
})
