const { RuleTester } = require('eslint');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = new RuleTester({
  languageOptions: {
    parser: typescriptParser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});
