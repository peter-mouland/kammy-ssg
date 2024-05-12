/* eslint-disable no-console */
// `gatsby build` expects this file to be named .env.production since it always set to process.env=production internally
// https://github.com/gatsbyjs/gatsby/issues/10563
require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
    debug: process.env.DEBUG,
});

const config = require('./src/config/config');

const hostOnRoot = ['true', true].includes(process.env.NODE_ENV === 'development');
const pathPrefix = hostOnRoot ? '/' : '/kammy-ssg';

console.log('process.env.NODE_ENV');
console.log(process.env.NODE_ENV);
console.log('process.env.PATH_PREFIX');
console.log(process.env.PATH_PREFIX);
console.log('process.env.ASSET_PREFIX');
console.log(process.env.ASSET_PREFIX);

module.exports = {
    pathPrefix: process.env.PATH_PREFIX || pathPrefix,
    assetPrefix: process.env.ASSET_PREFIX || '/',
    siteMetadata: {
        title: 'Draft Fantasy Football',
        siteUrl: 'https://peter-mouland.github.io/kammy-ssg',
        description: 'Draft Fantasy Football game',
    },
    plugins: [
        'gatsby-plugin-use-query-params',
        {
            resolve: 'gatsby-plugin-netlify',
            options: {
                // mergeCachingHeaders: false,
            },
        },
        {
            resolve: 'gatsby-plugin-buildtime-timezone',
            options: {
                tz: 'Europe/London',
                format: 'ddd, DD MMM YYYY HH:mm',
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
            resolve: '@kammy/gatsby-source-fpl',
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
