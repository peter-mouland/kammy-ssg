// `gatsby build` expects this file to be named .env.production since it always set to process.env=production internally
// https://github.com/gatsbyjs/gatsby/issues/10563
require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
    debug: process.env.DEBUG,
});

const config = require('./src/config/config');

const hostOnRoot = ['true', true].includes(process.env.NODE_ENV === 'development');
const pathPrefix = hostOnRoot ? '/' : '/kammy-ssg';

console.log(process.env.NODE_ENV);
console.log({ pathPrefix });

module.exports = {
    pathPrefix,
    assetPrefix: '/',
    siteMetadata: {
        title: 'Draft Fantasy Football',
        siteUrl: 'https://peter-mouland.github.io/kammy-ssg',
        description: 'Draft Fantasy Football game',
    },
    plugins: [
        {
            resolve: 'gatsby-plugin-react-css-modules',
        },
        {

            resolve: 'gatsby-plugin-sass',
            options: {
                includePaths: ['node_modules'],
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
