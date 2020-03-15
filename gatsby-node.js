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
exports.onCreateWebpackConfig = ({ stage, rules, loaders, plugins, actions }) => {
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

  // HOMEPAGE
  gameWeekData.allGameWeeks.nodes.forEach(({ gameWeek, isCurrent }) => {
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
    //   DIVISION RANKINGS
    divisionData.allDivisions.nodes.forEach(({ key, label }) => {
      const url = label.replace(/ /g, '-').toLowerCase();
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
    });
    if (isCurrent) {
      actions.createPage({
        path: `/`,
        matchPath: `/`,
        component: path.resolve('src/templates/homepage.js'),
        context: {
          gameWeek,
          prevGameWeek: gameWeek - 1,
          nextGameWeek: gameWeek + 1,
        },
      });
      divisionData.allDivisions.nodes.forEach(({ key, label }) => {
        const url = label.replace(/ /g, '-').toLowerCase();
        actions.createPage({
          path: `/${url}/rankings`,
          matchPath: `/${url}/rankings/`, // otherwise gatsby will redirect on refresh
          component: path.resolve('src/templates/division-rankings.js'),
          context: {
            gameWeek,
            divisionKey: key,
            divisionLabel: label,
          },
        });
      });
    }
  });
};

exports.sourceNodes = async ({ actions }) => {
};

exports.onPostBuild = async () => {
};
