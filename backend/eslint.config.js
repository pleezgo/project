const js = require('@eslint/js')
const globals = require('globals')
const jsdoc = require('eslint-plugin-jsdoc')

module.exports = [
  {
    ignores: ['node_modules'],
  },
  {
    ...jsdoc.configs['flat/recommended'],
    files: ['src/**/*.js'],
  },
  {
    files: ['src/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
]