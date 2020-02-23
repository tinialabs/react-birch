// FIX-DEPENDENCIES
require.resolve('eslint-config-berun')

module.exports = {
  extends: [
    'berun'
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 0,
    'global-require': 0,
    'import/no-dynamic-require': 0,
    '@typescript-eslint/no-var-requires': 0,
    'react/style-prop-object': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/jsx-wrap-multilines': 0,
    'no-nested-ternary': 0,
    'react/jsx-pascal-case': 0,
    'react/jsx-fragments': 0,
    'prefer-spread': 0,
    'react/no-children-prop': 0,
    'prefer-destructuring': 0
  }
}
