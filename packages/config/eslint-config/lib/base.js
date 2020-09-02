const rules = require('./rules');
const overrides = require('./overrides');

module.exports = {
    root: true,
    parser: 'babel-eslint',
    env: {
        es6: true,
        node: true,
    },
    plugins: ['prettier', 'postcss-modules'],
    extends: ['eslint:recommended', 'airbnb', 'prettier', 'plugin:postcss-modules/recommended'],
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
