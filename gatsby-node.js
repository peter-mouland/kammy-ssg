/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const webpack = require('webpack');
const axios = require('axios');
const fs = require('fs').promises;
const glob = require('glob');

require('dotenv').config({
    path: '.env.production',
    debug: process.env.DEBUG,
});

const config = require('./src/config/config');


// eslint-disable-next-line no-unused-vars
exports.onCreateWebpackConfig = ({ stage, rules, loaders, plugins, actions }) => {
    actions.setWebpackConfig({
        resolve: {
            // added to ensure `yarn link package` works
            alias: {
                react: path.resolve('node_modules/react'),
                'gatsby-link': path.resolve('node_modules/gatsby-link'),
                'react-dom': path.resolve('node_modules/react-dom'),
                'react-redux': path.resolve('node_modules/react-redux'),
                'react-router-dom': path.resolve('node_modules/react-router-dom'),
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
  // HOMEPAGE
  const { data: homepageData } = await graphql(`
        query {
            allGameWeeks {
                nodes {
                    gameWeek
                }
            }
        }
    `);
  homepageData.allGameWeeks.nodes.forEach(({ gameWeek }) => {
    const pageConfig = {
      path: `/week-${gameWeek}`,
      matchPath: `/week-${gameWeek}/`, // otherwise gatsby will redirect on refresh
      component: path.resolve('src/templates/homepage.js'),
      context: {
        gameWeek,
      },
    };
    actions.createPage(pageConfig);
  });
};

exports.sourceNodes = async ({ actions }) => {
};

exports.onPostBuild = async () => {
};
