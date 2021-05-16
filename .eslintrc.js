// Sync Labs defaults
// See https://github.com/synclabs-dev/eslint-config
// Includes Typescript and prettier

// FIX-DEPENDENCIES
require.resolve('eslint')
require.resolve('prettier')

// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@sync-labs/eslint-config/patch/modern-module-resolution')

// The ESLint browser environment defines all browser globals as valid,
// even though most people don't know some of them exist (e.g. `name` or `status`).
// This is dangerous as it hides accidentally undefined variables.
// We blacklist the globals that we deem potentially confusing.
// To use them, explicitly reference them, e.g. `window.name` or `window.status`.

module.exports = {
    root: true,
    extends: [ "@sync-labs/eslint-config/profile/node",
    "@sync-labs/eslint-config/mixins/react",
    ],  // <---- put your profile string here
    parserOptions: { 
        tsconfigRootDir: __dirname,  
        ecmaVersion: 2017 ,
        sourceType: "module"
    },
    rules: {
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@rushstack/no-new-null': 'off',
        'require-atomic-updates': 'off',
        'no-void': 'off',
        'import/named': 'off',
        'import/prefer-default-export': 'off',
        '@typescript-eslint/member-ordering': 'off',
        'no-bitwise': 'off',
        'react/jsx-no-bind': 'off'
    },
    env: {
        es6: true
    }
  }