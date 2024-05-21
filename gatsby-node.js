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

exports.onCreateBabelConfig = () => {};

exports.onPreBootstrap = () => {};

exports.onCreateDevServer = () => {};

exports.createPages = async ({ actions, graphql }) => {
    const { data } = await graphql(`
        {
            allGameWeeks {
                nodes {
                    gameWeekIndex
                    isCurrent
                    isFinal
                }
            }
            allDivisions(sort: { order: ASC }) {
                nodes {
                    divisionId
                    url
                }
            }
            allPlayers {
                nodes {
                    code
                    url
                }
            }
            allManagers(sort: { managerId: ASC }) {
                nodes {
                    managerId
                    divisionId
                    url
                }
            }
        }
    `);

    // a new page for each gameweek
    let maxGameweek = 99;
    const pageNodesToBuild = [];

    data?.allGameWeeks.nodes.forEach(({ gameWeekIndex, isCurrent, isFinal, ...rest }) => {
        // if (!isCurrent) return;
        if (gameWeekIndex > maxGameweek) return;
        if (isCurrent) maxGameweek = gameWeekIndex + 1;

        // HOMEPAGE (by game-week)
        const prevGameWeekIndex = gameWeekIndex - 1;
        const nextGameWeekIndex = gameWeekIndex + 1;
        pageNodesToBuild.push({
            path: `/week-${gameWeekIndex}`.replaceAll('//', '/'),
            component: path.resolve('src/templates/homepage.jsx'),
            context: {
                gameWeekIndex,
                prevGameWeekIndex,
                nextGameWeekIndex,
            },
        });
        // a new page for each division
        data?.allDivisions.nodes.forEach(({ divisionId, url }) => {
            //   DIVISION RANKINGS (by game-week)
            pageNodesToBuild.push({
                path: `/week-${gameWeekIndex}/${url}`.replaceAll('//', '/'),
                component: path.resolve('src/templates/division-rankings.jsx'),
                context: {
                    gameWeekIndex,
                    divisionId,
                },
            });
            //   DIVISION TEAMS (by game-week)
            pageNodesToBuild.push({
                path: `/week-${gameWeekIndex}/${url}/teams`.replaceAll('//', '/'),
                component: path.resolve('src/templates/division-teams.jsx'),
                context: {
                    gameWeekIndex,
                    prevGameWeekIndex,
                    divisionId,
                },
            });
            // DIVISION TRANSFERS
            pageNodesToBuild.push({
                path: `/week-${gameWeekIndex}/${url}/transfers`.replaceAll('//', '/'),
                component: path.resolve('src/templates/division-transfers.jsx'),
                context: {
                    gameWeekIndex,
                    prevGameWeekIndex,
                    divisionId,
                },
            });
            //   DIVISION PLAYERS
            pageNodesToBuild.push({
                path: `/week-${gameWeekIndex}/${url}/players`.replaceAll('//', '/'),
                component: path.resolve('src/templates/division-players.jsx'),
                context: {
                    gameWeekIndex,
                    prevGameWeekIndex,
                    divisionId,
                },
            });
        });
        if (isCurrent || isFinal) {
            // HOMEPAGE
            pageNodesToBuild.push({
                path: '/',
                component: path.resolve('src/templates/homepage.jsx'),
                context: {
                    gameWeekIndex,
                    prevGameWeekIndex,
                    nextGameWeekIndex,
                },
            });
            //   CUP
            pageNodesToBuild.push({
                path: `/cup`,
                component: path.resolve('src/templates/cup-index.jsx'),
                context: {
                    gameWeekIndex,
                    prevGameWeekIndex,
                    nextGameWeekIndex,
                },
            });
            //   PLAYER
            data?.allPlayers.nodes.forEach(({ url, code }) => {
                pageNodesToBuild.push({
                    path: url,
                    component: path.resolve('src/templates/player.jsx'),
                    context: {
                        gameWeekIndex,
                        code,
                    },
                });
            });
            //   MANAGER
            data?.allManagers.nodes.forEach(({ divisionId, managerId, url }) => {
                pageNodesToBuild.push({
                    path: url,
                    component: path.resolve('src/templates/manager.jsx'),
                    context: {
                        gameWeekIndex,
                        managerId,
                        divisionId,
                    },
                });
            });

            data?.allDivisions.nodes.forEach(({ divisionId, url }) => {
                //   DIVISION RANKINGS
                pageNodesToBuild.push({
                    path: `/${url}`.replaceAll('//', '/'),
                    component: path.resolve('src/templates/division-rankings.jsx'),
                    context: {
                        gameWeekIndex,
                        prevGameWeekIndex,
                        divisionId,
                    },
                });
                //   DIVISION TEAMS
                pageNodesToBuild.push({
                    path: `/${url}/teams`.replaceAll('//', '/'),
                    component: path.resolve('src/templates/division-teams.jsx'),
                    context: {
                        gameWeekIndex,
                        prevGameWeekIndex,
                        divisionId,
                    },
                });
                //   DIVISION PLAYERS
                pageNodesToBuild.push({
                    path: `/${url}/players`.replaceAll('//', '/'),
                    component: path.resolve('src/templates/division-players.jsx'),
                    context: {
                        gameWeekIndex,
                        prevGameWeekIndex,
                        divisionId,
                    },
                });
                //   DIVISION TRANSFERS
                pageNodesToBuild.push({
                    path: `/${url}/transfers`.replaceAll('//', '/'),
                    component: path.resolve('src/templates/division-transfers.jsx'),
                    context: {
                        gameWeekIndex,
                        prevGameWeekIndex,
                        divisionId,
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
