const rules = require('./rules');
const overrides = require('./overrides');

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
        es6: true,
        node: true,
    },
    plugins: ['@typescript-eslint', 'prettier', 'postcss-modules'],
    extends: [
        'eslint:recommended',
        'airbnb',
        'prettier',
        'plugin:postcss-modules/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    globals: {},
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            ecmaVersion: 2018,
            classes: true,
        },
    },
    rules,
    overrides,
};
