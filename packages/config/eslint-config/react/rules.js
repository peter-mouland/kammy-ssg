module.exports = {
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/exhaustive-deps': 1,
    'react/jsx-indent': 0,
    'react/jsx-fragments': ['error', 'element'],
    'react/jsx-indent-props': 0,
    'react/jsx-no-undef': [2, { allowGlobals: true }],
    'react/jsx-wrap-multilines': ['error', { declaration: false, assignment: false }],
    'react/no-danger': 2,
    'react/sort-comp': [
        2,
        {
            order: ['static-methods', 'instance-variables', 'lifecycle', 'everything-else', 'render'],
        },
    ],
    'react/jsx-props-no-spreading': 0,
    'react/destructuring-assignment': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/jsx-filename-extension': 0,
    /*
     Everything below here has been 'ignored' temporarily.
     Please feel to delete any of the following lines and fix any errors.
     Please only submit one rule change per PR.
     Thanks!
     */
    'react/forbid-prop-types': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    /*
     Everything below here will be moved from warning to error within 2 weeks
     */
    'react/state-in-constructor': ['warn', 'never'],
    'react/static-property-placement': ['warn', 'property assignment'],
    'jsx-a11y/control-has-associated-label': ['warn'],
    'react/jsx-curly-newline': ['warn'],
};
