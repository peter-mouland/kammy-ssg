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
        'gatsby-plugin-netlify',
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
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                // The property ID; the tracking code won't be generated without it
                trackingId: 'UA-144222833-1',
                // Defines where to place the tracking script - `true` in the head and `false` in the body
                head: false,
                // Setting this parameter is optional
                anonymize: true,
                // Setting this parameter is also optional
                respectDNT: true,
                // Avoids sending pageview hits from custom paths
                exclude: [],
                // Delays sending pageview hits on route update (in milliseconds)
                pageTransitionDelay: 0,
                // Enables Google Optimize using your container Id
                // optimizeId: "YOUR_GOOGLE_OPTIMIZE_TRACKING_ID",
                // Enables Google Optimize Experiment ID
                // experimentId: "YOUR_GOOGLE_EXPERIMENT_ID",
                // Set Variation ID. 0 for original 1,2,3....
                // variationId: "YOUR_GOOGLE_OPTIMIZE_VARIATION_ID",
                // Defers execution of google analytics script after page load
                defer: true,
                // Any additional optional fields
                // sampleRate: 5,
                // siteSpeedSampleRate: 10,
                // cookieDomain: "example.com",
            },
        },
    ],
};
