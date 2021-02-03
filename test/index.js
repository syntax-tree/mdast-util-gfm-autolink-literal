'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var toHtml = require('hast-util-to-html')
var toHast = require('mdast-util-to-hast')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var syntax = require('micromark-extension-gfm-autolink-literal')
var autolinkLiterals = require('..')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown(
      'www.example.com, https://example.com, and contact@example.com.',
      {extensions: [syntax], mdastExtensions: [autolinkLiterals.fromMarkdown]}
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

  t.deepEqual(
    toMarkdown(
      {type: 'definition', label: 'http://a'},
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '[http://a]: <>\n',
    'should not escape colons in definition labels'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'http://a',
            children: [{type: 'text', value: 'http://a'}]
          }
        ]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '[http://a][]\n',
    'should not escape colons in link (reference) labels (shortcut)'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'a',
            children: [{type: 'text', value: 'http://a'}]
          }
        ]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '[http://a][a]\n',
    'should not escape colons in link (reference) labels (text)'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            label: 'http://a',
            children: [{type: 'text', value: 'a'}]
          }
        ]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '[a][http://a]\n',
    'should not escape colons in link (reference) labels (label)'
  )

  t.deepEqual(
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
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '[a](http://a)\n',
    'should not escape colons in link (resource) labels'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'imageReference', label: 'http://a', alt: 'a'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '![a][http://a]\n',
    'should not escape colons in image (reference) labels (label)'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'imageReference', label: 'a', alt: 'http://a'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '![http://a][a]\n',
    'should not escape colons in image (reference) labels (alt)'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [{type: 'image', url: 'http://a', alt: 'a'}]
      },
      {extensions: [autolinkLiterals.toMarkdown]}
    ),
    '![a](http://a)\n',
    'should not escape colons in image (resource) labels'
  )

  fs.readdirSync(__dirname)
    .filter((d) => path.extname(d) === '.md')
    .forEach((d) => {
      var stem = path.basename(d, '.md')
      var actual = toHtml(
        toHast(
          fromMarkdown(fs.readFileSync(path.join(__dirname, d)), {
            extensions: [syntax],
            mdastExtensions: [autolinkLiterals.fromMarkdown]
          }),
          {allowDangerousHtml: true}
        ),
        {allowDangerousHtml: true, entities: {useNamedReferences: true}}
      )
      var expected = String(
        fs.readFileSync(path.join(__dirname, stem + '.html'))
      )

      if (actual.charCodeAt(actual.length - 1) !== 10) {
        actual += '\n'
      }

      t.deepEqual(actual, expected, stem)
    })

  t.end()
})
