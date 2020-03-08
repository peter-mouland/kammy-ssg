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
    plugins: [
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-plugin-mdx',
        },
        {
            resolve: 'gatsby-transformer-sharp',
        },
        {
            resolve: 'gatsby-plugin-sharp',
            useMozJpeg: true,
            stripMetadata: true,
            defaultQuality: 75,
        },
        {
            resolve: 'gatsby-plugin-webpack-bundle-analyser-v2',
            options: {
                generateStatsFile: true,
            },
        },
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: `Draft FF`,
                short_name: `Draft FF`,
                start_url: `/`,
                display: `browser`,
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
        {
            resolve: 'gatsby-plugin-html-attributes',
            options: {
                lang: 'en',
            },
        },
    ],
};
