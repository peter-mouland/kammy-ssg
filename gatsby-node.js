/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const webpack = require('webpack');
const { tokens } = require('@kammy/tokens');
const postcssPreset = require('postcss-preset-env');
const postcssHexrgba = require('postcss-hexrgba');

const addCssPrefix = (cssObj) => Object.keys(cssObj).reduce((prev, bp) => ({ ...prev, [`--${bp}`]: cssObj[bp] }), {});

require('dotenv').config({
    path: '.env.production',
    debug: process.env.DEBUG,
});

const overrideBrowserslist = [
    'last 2 Chrome versions',
    'last 2 Firefox versions',
    'last 2 Edge versions',
    'safari >= 12',
    'ios_saf >= 12',
    'Android >= 9',
];

// eslint-disable-next-line no-unused-vars
exports.onCreateWebpackConfig = ({ actions, loaders }) => {
    actions.setWebpackConfig({
        resolve: {
            // added to ensure `yarn link package` works
            alias: {
                react: path.resolve('node_modules/react'),
                'gatsby-link': path.resolve('node_modules/gatsby-link'),
            },
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.RELEASE': JSON.stringify(new Date().toISOString()),
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        loaders.postcss({
                            plugins: [
                                postcssPreset({
                                    stage: 0, // enable custom-media-queries
                                    preserve: false,
                                    features: {
                                        'focus-within-pseudo-class': false,
                                        'custom-properties':
                                        Object.keys(tokens.properties).length > 0
                                            ? {
                                                preserve: false, // true: keep css-properties in the css output
                                            }
                                            : false,
                                        'custom-media-queries':
                                        Object.keys(tokens.mediaQueries).length > 0
                                            ? {
                                                preserve: false,
                                            }
                                            : false,
                                    },
                                    overrideBrowserslist,
                                    autoprefixer: { grid: true },
                                    importFrom: {
                                        customProperties: addCssPrefix(tokens.properties),
                                        customMedia: addCssPrefix(tokens.mediaQueries),
                                    },
                                }),
                                postcssHexrgba,
                            ],
                        }),
                    ],
                },
            ],
        },
    });
};

exports.onCreateBabelConfig = ({ actions }) => {
    actions.setBabelPlugin({
        name: '@babel/plugin-proposal-object-rest-spread',
    });

    actions.setBabelPlugin({
        name: '@babel/plugin-proposal-class-properties',
    });

    actions.setBabelPlugin({
        name: '@babel/plugin-syntax-dynamic-import',
    });
};

exports.onPreBootstrap = () => {
};

exports.onCreateDevServer = () => {
};

exports.createPages = async ({ actions, graphql }) => {
    const { data: { allGameWeeks, allDivisions } } = await graphql(`
        query {
            allGameWeeks {
                nodes {
                    gameWeek
                    isCurrent
                }
            }
            allDivisions(sort: { fields: order }) {
                nodes {
                    key
                    label
                    order
                }
            }
        }
    `);

    // a new page for each gameweek
    allGameWeeks.nodes.forEach(({ gameWeek, isCurrent }) => {
        // HOMEPAGE (by game-week)
        const prev2GameWeek = gameWeek - 2;
        const prevGameWeek = gameWeek - 1;
        const nextGameWeek = gameWeek + 1;
        actions.createPage({
            path: `/week-${gameWeek}`,
            matchPath: `/week-${gameWeek}/`, // otherwise gatsby will redirect on refresh
            component: path.resolve('src/templates/homepage.js'),
            context: {
                gameWeek,
                prevGameWeek,
                nextGameWeek,
            },
        });

        // a new page for each division
        allDivisions.nodes.forEach(({ key, label }) => {
            const url = label.replace(/ /g, '-').toLowerCase();
            //   DIVISION RANKINGS (by game-week)
            actions.createPage({
                path: `/week-${gameWeek}/${url}/rankings`,
                matchPath: `/week-${gameWeek}/${url}/rankings/`, // otherwise gatsby will redirect on refresh
                component: path.resolve('src/templates/division-rankings.js'),
                context: {
                    gameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
            //   DIVISION TEAMS (by game-week)
            actions.createPage({
                path: `/week-${gameWeek}/${url}/teams`,
                matchPath: `/week-${gameWeek}/${url}/teams/`, // otherwise gatsby will redirect on refresh
                component: path.resolve('src/templates/division-teams.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
            // DIVISION PLAYERS
            actions.createPage({
                path: `/week-${gameWeek}/${url}/players`,
                matchPath: `/week-${gameWeek}/${url}/players/`, // otherwise gatsby will redirect on refresh
                component: path.resolve('src/templates/division-players.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
            // DIVISION TRANSFERS
            actions.createPage({
                path: `/week-${gameWeek}/${url}/transfers`,
                matchPath: `/week-${gameWeek}/${url}/transfers/`, // otherwise gatsby will redirect on refresh
                component: path.resolve('src/templates/division-transfers.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    prev2GameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
        });
        if (isCurrent) {
            // HOMEPAGE
            actions.createPage({
                path: '/',
                matchPath: '/',
                component: path.resolve('src/templates/homepage.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    nextGameWeek,
                },
            });
            allDivisions.nodes.forEach(({ key, label }) => {
                const url = label.replace(/ /g, '-').toLowerCase();
                //   DIVISION RANKINGS
                actions.createPage({
                    path: `/${url}/rankings`,
                    matchPath: `/${url}/rankings/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-rankings.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION TEAMS
                actions.createPage({
                    path: `/${url}/teams`,
                    matchPath: `/${url}/teams/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-teams.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION PLAYERS
                actions.createPage({
                    path: `/${url}/players`,
                    matchPath: `/${url}/players/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-players.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION TRANSFERS
                actions.createPage({
                    path: `/${url}/transfers`,
                    matchPath: `/${url}/transfers/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-transfers.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        prev2GameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
            });
        }
    });
};

exports.sourceNodes = async () => {
};

exports.onPostBuild = async () => {
};
