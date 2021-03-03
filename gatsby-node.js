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
const postcssNested = require('postcss-nested');

const addCssPrefix = (cssObj) => Object.keys(cssObj).reduce((prev, bp) => ({ ...prev, [`--${bp}`]: cssObj[bp] }), {});

require('dotenv').config({
    path: '.env.production',
    debug: process.env.DEBUG,
});

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
                'process.env.FUNCTIONS_HOST': JSON.stringify(process.env.FUNCTIONS_HOST),
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
                                    importFrom: {
                                        customProperties: addCssPrefix(tokens.properties),
                                        customMedia: addCssPrefix(tokens.mediaQueries),
                                    },
                                }),
                                postcssHexrgba,
                                postcssNested,
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

exports.onPreBootstrap = () => {};

exports.onCreateDevServer = () => {};

exports.createPages = async ({ actions, graphql }) => {
    const {
        data: { allGameWeeks, allDivisions, allPlayers, allManagers },
    } = await graphql(`
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
            allPlayers {
                nodes {
                    code
                    name
                    url
                }
            }
            allManagers(sort: { fields: managerKey }) {
                nodes {
                    manager
                    managerKey
                    url
                    divisionKey
                }
            }
        }
    `);

    // a new page for each gameweek
    let maxGameweek = 99;
    const pageNodesToBuild = [];

    allGameWeeks.nodes.forEach(({ gameWeek, isCurrent }) => {
        if (gameWeek > maxGameweek) return;
        if (isCurrent) maxGameweek = gameWeek + 1;
        if (isCurrent) {
            console.log({ isCurrent, gameWeek });
        }

        // HOMEPAGE (by game-week)
        const prevGameWeek = gameWeek - 1;
        const nextGameWeek = gameWeek + 1;
        pageNodesToBuild.push({
            path: `/week-${gameWeek}`,
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
            pageNodesToBuild.push({
                path: `/week-${gameWeek}/${url}`,
                component: path.resolve('src/templates/division-rankings.js'),
                context: {
                    gameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
            //   DIVISION TEAMS (by game-week)
            pageNodesToBuild.push({
                path: `/week-${gameWeek}/${url}/teams`,
                component: path.resolve('src/templates/division-teams.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
            // DIVISION TRANSFERS
            pageNodesToBuild.push({
                path: `/week-${gameWeek}/${url}/transfers`,
                component: path.resolve('src/templates/division-transfers.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    divisionKey: key,
                    divisionLabel: label,
                },
            });
        });
        if (isCurrent) {
            // HOMEPAGE
            pageNodesToBuild.push({
                path: '/',
                component: path.resolve('src/templates/homepage.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    nextGameWeek,
                },
            });
            //   CUP
            pageNodesToBuild.push({
                path: `/cup`,
                component: path.resolve('src/templates/cup-index.js'),
                context: {
                    gameWeek,
                    prevGameWeek,
                    nextGameWeek,
                },
            });
            //   PLAYER
            allPlayers.nodes.forEach(({ name: playerName, url, code }) => {
                pageNodesToBuild.push({
                    path: url,
                    component: path.resolve('src/templates/player.js'),
                    context: {
                        gameWeek,
                        playerName,
                        code,
                    },
                });
            });
            //   MANAGER
            allManagers.nodes.forEach(({ divisionKey, manager: managerName, managerKey, url }) => {
                pageNodesToBuild.push({
                    path: url,
                    component: path.resolve('src/templates/manager.js'),
                    context: {
                        gameWeek,
                        managerName,
                        managerKey,
                        divisionKey,
                    },
                });
            });

            allDivisions.nodes.forEach(({ key, label }) => {
                const url = label.replace(/ /g, '-').toLowerCase();
                //   DIVISION RANKINGS
                pageNodesToBuild.push({
                    path: `/${url}`,
                    component: path.resolve('src/templates/division-rankings.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION TEAMS
                pageNodesToBuild.push({
                    path: `/${url}/teams`,
                    component: path.resolve('src/templates/division-teams.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION PLAYERS
                pageNodesToBuild.push({
                    path: `/${url}/players`,
                    component: path.resolve('src/templates/division-players.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION TRANSFERS
                pageNodesToBuild.push({
                    path: `/${url}/transfers`,
                    component: path.resolve('src/templates/division-transfers.js'),
                    context: {
                        gameWeek,
                        prevGameWeek,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
            });
        }
    });

    const promises = pageNodesToBuild.map((args) => {
        console.log(`CREATE ${args.path}`);
        return actions.createPage({
            ...args,
            matchPath: `${args.path}/`, // otherwise gatsby will redirect on refresh
        });
    });
    await Promise.all(promises);
};

exports.sourceNodes = async () => {};

exports.onPostBuild = async () => {};
