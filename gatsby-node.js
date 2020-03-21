/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const webpack = require('webpack');

require('dotenv').config({
    path: '.env.production',
    debug: process.env.DEBUG,
});

// eslint-disable-next-line no-unused-vars
exports.onCreateWebpackConfig = ({ actions }) => {
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
    const { data: gameWeekData } = await graphql(`
        query {
            allGameWeeks {
                nodes {
                    gameWeek
                    isCurrent
                }
            }
        }
    `);
    const { data: divisionData } = await graphql(`
        query {
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
    gameWeekData.allGameWeeks.nodes.forEach(({ gameWeek, isCurrent }) => {
        // HOMEPAGE (by game-week)
        actions.createPage({
            path: `/week-${gameWeek}`,
            matchPath: `/week-${gameWeek}/`, // otherwise gatsby will redirect on refresh
            component: path.resolve('src/templates/homepage.js'),
            context: {
                gameWeek,
                prevGameWeek: gameWeek - 1,
                nextGameWeek: gameWeek + 1,
            },
        });

        // a new page for each division
        divisionData.allDivisions.nodes.forEach(({ key, label }) => {
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
                    prevGameWeek: gameWeek - 1,
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
                    prevGameWeek: gameWeek - 1,
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
                    prevGameWeek: gameWeek - 1,
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
                    prevGameWeek: gameWeek - 1,
                    nextGameWeek: gameWeek + 1,
                },
            });
            divisionData.allDivisions.nodes.forEach(({ key, label }) => {
                const url = label.replace(/ /g, '-').toLowerCase();
                //   DIVISION RANKINGS
                actions.createPage({
                    path: `/${url}/rankings`,
                    matchPath: `/${url}/rankings/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-rankings.js'),
                    context: {
                        gameWeek,
                        prevGameWeek: gameWeek - 1,
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
                        prevGameWeek: gameWeek - 1,
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
                        prevGameWeek: gameWeek - 1,
                        divisionKey: key,
                        divisionLabel: label,
                    },
                });
                //   DIVISION TRNSFERS
                actions.createPage({
                    path: `/${url}/transfers`,
                    matchPath: `/${url}/transfers/`, // otherwise gatsby will redirect on refresh
                    component: path.resolve('src/templates/division-transfers.js'),
                    context: {
                        gameWeek,
                        prevGameWeek: gameWeek - 1,
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
