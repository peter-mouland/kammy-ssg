module.exports = {
    'prettier/prettier': [
        'error',
        {
            singleQuote: true,
            trailingComma: 'all',
            arrowParens: 'always',
            printWidth: 120,
        },
    ],
    indent: 0,
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0 }],
    'import/order': [
        'error',
        {
            'newlines-between': 'always',
            groups: [
                ['builtin', 'external'],
                ['parent', 'sibling', 'index'],
            ],
        },
    ],
    'no-unused-expressions': ['error', { allowTernary: true }],
    quotes: 0,
    semi: ['error', 'always'],
    'no-console': 2,
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'eol-last': ['error', 'always'],
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
    'max-len': [2, { code: 120, ignoreStrings: true }],
    'arrow-parens': [2, 'always'],
    'function-paren-newline': 0,
    'comma-dangle': [
        'error',
        {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'ignore',
        },
    ],
    'no-irregular-whitespace': 0,
    /*
      An unspaced *i18n* comment is necessary for jsLingui
      to be able to extract messages and build locale catalogues
    */
    'spaced-comment': ['error', 'always', { exceptions: ['i18n'] }],
    // 'object-curly-newline': [
    //     'error',
    //     {
    //         ObjectExpression: {
    //             minProperties: 5,
    //             multiline: true,
    //             consistent: true,
    //         },
    //         ObjectPattern: {
    //             minProperties: 5,
    //             multiline: true,
    //             consistent: true,
    //         },
    //         ImportDeclaration: {
    //             minProperties: 5,
    //             multiline: true,
    //             consistent: true,
    //         },
    //         ExportDeclaration: {
    //             minProperties: 5,
    //             multiline: true,
    //             consistent: true,
    //         },
    //     },
    // ],
    'implicit-arrow-linebreak': 0,
    'no-else-return': ['error', { allowElseIf: true }],
    'no-underscore-dangle': 0,
    'global-require': 0,
    /*
     disabled so as not to force a build before running lint
    */
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    /*
     Everything below here has been 'ignored' temporarily.
     Please feel to delete any of the following lines and fix any errors.
     Please only submit one rule change per PR.
     Thanks!
     */
    'import/named': ['warn'],
    'import/export': ['warn'],
    'prefer-promise-reject-errors': ['warn'],
    'guard-for-in': ['warn'],
    'postcss-modules/no-unused-class': ['warn'],
    'postcss-modules/no-undef-class': ['warn'],
};
