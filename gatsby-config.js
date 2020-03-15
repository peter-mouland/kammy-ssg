// `gatsby build` expects this file to be named .env.production sinse it always set to process.env=production internally
// https://github.com/gatsbyjs/gatsby/issues/10563
require('dotenv').config({
    path: '.env.production',
    debug: process.env.DEBUG,
});

const config = require('./src/config/config');

const assetsOnRoot = process.env.DEV || process.env.IS_LOCAL;

const getAssetPath = () => !assetsOnRoot;

module.exports = {
    pathPrefix: `/`,
    assetPrefix: getAssetPath(),
    siteMetadata: {
      title: `Draft Fantasy Football`,
      siteUrl: `http://draftff.herokuapp.com`,
      description: `Draft Fantasy Football game`,
    },
    plugins: [
        {
          resolve: `gatsby-plugin-sass`,
          options: {
            includePaths: ["node_modules"],
          },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'assets',
                path: `${__dirname}/src/assets`,
            },
        },
        {
            resolve: '@kammy/gatsby-source-sky-sports',
            options: config,
        },
        {
            resolve: 'gatsby-plugin-react-svg',
            options: {
                rule: {
                    include: /\.svg$/,
                },
            },
        },
    ],
};
