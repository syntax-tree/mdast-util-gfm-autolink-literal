/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      curly: 'off',
      'import-x/order': 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'no-shadow': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-object-spread': 'off',
      'regexp/prefer-character-class': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'regexp/use-ignore-case': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/better-dom-traversing': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-boolean-return': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-continue': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/require-array-sort-compare': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  // Wrong.
  {ignores: ['**/*.md', 'test/fixture/**/*.html']},
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-files': 'off',
      'package-json/sort-properties': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'no-await-in-loop': 'off'
    }
  }
]

export default xoConfig
