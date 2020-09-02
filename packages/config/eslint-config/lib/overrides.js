const globals = require('globals');

module.exports = [
    // Cypress
    {
        files: [
            '**/*.spec.js',
            '**/*.page.js',
            '**/*.e2e.js',
            'cypress/**/**.js',
            '**/*.func.js',
            '**/*.routes.js',
            '**/*.actions.js',
        ],
        plugins: ['prettier', 'mocha'],
        globals: Object.assign(globals.browser, globals.mocha, {
            cy: false,
            Cypress: false,
            expect: false,
            assert: false,
        }),
        parserOptions: {
            ecmaVersion: 2017,
            sourceType: 'module',
        },
        rules: {
            'prefer-arrow-callback': 0,
            'func-names': 0,
            'mocha/no-exclusive-tests': 'error',
        },
    },
    // Jest
    {
        files: ['**/*.test.js'],
        env: {
            jest: true,
        },
        plugins: ['prettier', 'jest'],
        rules: {
            /* no need to destructure in tests for many `let` uses */
            'prefer-destructuring': 0,
            'global-require': 0,
            'react/jsx-props-no-spreading': 0,
            'postcss-modules/no-unused-class': 0,
            'postcss-modules/no-undef-class': 0,

            /*
          Below are auto fixed
         */
            'jest/consistent-test-it': 'error',
            'jest/no-test-prefixes': 'error',
            'jest/prefer-to-have-length': 'error',
            'jest/prefer-to-be-null': 'error',
            'jest/prefer-to-be-undefined': 'error',
            /*
          Below are recommended
        */
            'jest/no-disabled-tests': 'error',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/no-jest-import': 'error',
            /*
          Below are just good CS things we already do
        */
            'jest/valid-expect': 'error',
            'jest/valid-expect-in-promise': 'error',
            'jest/no-large-snapshots': 'error',
            'jest/valid-describe': 'error',
            /*
         Everything below here has been 'ignored' temporarily.
         Please feel to delete any of the following lines and fix any errors.
         Please only submit one rule change per PR.
         Thanks!
         */
            'jest/lowercase-name': 0,
            'jest/no-hooks': 0,
            'jest/prefer-expect-assertions': 0,
        },
    },
];
