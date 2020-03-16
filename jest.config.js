module.exports = {
    testEnvironment: 'enzyme',
    testEnvironmentOptions: {
        enzymeAdapter: 'react16',
    },
    setupFiles: [
        '<rootDir>/tests/jest/enzymeSetup.js',
        '<rootDir>/tests/jest/reactShim.js',
    ],
    setupFilesAfterEnv: ['jest-enzyme'],
    coverageThreshold: {
        global: {
            statements: 15,
            branches: 15,
            functions: 15,
            lines: 15,
        },
    },
    roots: ['<rootDir>'],
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    reporters: ['default', 'jest-junit'],
    transform: {
        '^.+\\.jsx?$': '<rootDir>/jest-preprocess.js',
    },
    testRegex: '.spec.jsx?$',
    testPathIgnorePatterns: ['/node_modules/', '/compiled/'],
    transformIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'jsx', 'json'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/jest/__mocks__/fileMock.js',
        '\\.(css|scss)$': '<rootDir>/tests/jest/__mocks__/styleMock.js',
    },
    collectCoverageFrom: [
        'packages/**/*.{js,jsx}',
        '!**/*.story.{js,jsx}',
        '!**/*.test.{js,jsx}',
        '!**/*.spec.{js,jsx}',
        '!**/*.min.{js,jsx}',
        '!**/node_modules/**',
        '!**/compiled/**',
        '!**/dist/**',
    ],
    globals: {
        __PATH_PREFIX__: '',
    },

    /**
     * Automatically reset mock state between every test.
     * Equivalent to calling jest.resetAllMocks() between each test.
     *
     * Sane default with resetModules: true because mocks need to be inside beforeEach
     * for them to work correctly
     */
    resetMocks: true,

    /**
     *  The module registry for every test file will be reset before running each individual test.
     *  This is useful to isolate modules for every test so that local module state doesn't conflict between tests.
     */
    resetModules: true,

    /**
     * Equivalent to calling jest.restoreAllMocks() between each test.
     *
     * Resets jest.spyOn mocks only
     */
    restoreMocks: true,
};
