const base = require('../lib/base');
const reactRules = require('./rules');

module.exports = {
    ...base,
    plugins: base.plugins.slice(0).concat(['react', 'jsx-control-statements', 'react-hooks']),
    settings: { react: { version: 'detect' } },
    extends: ['plugin:react/recommended', 'plugin:jsx-control-statements/recommended'].concat(base.extends), // this is last as ordering is important here
    globals: {
        ...base.globals,
        document: true,
        window: true,
        shallow: true,
        render: true,
        mount: true,
        classHelper: true,
        localStorage: true,
    },
    parserOptions: {
        ...base.parserOptions,
        ecmaFeatures: { ...base.parserOptions.ecmaFeatures, jsx: true },
    },
    rules: { ...base.rules, ...reactRules },
};
