# Kammy-ssg

 > Static Site Generator for Kammy Draft Fantasy Football

Uses [Gatsby](https://www.gatsbyjs.com/docs/) and [GatsbyCloud](https://www.gatsbyjs.com/dashboard) to generate the build, which is hosted on [netlify](https://app.netlify.com/teams/peter-mouland/sites) and visible at [draftff.netlify.com](http://draftff.netlify.com/)

## Local Dev

 - `yarn start`
 - or `yarn dev` (wip: using netlify)

## Data Sources

 - Fetches data via the [rest v4 API](https://developers.google.com/sheets/api)
 - Saving data via [kammy-proxy project](http://github.com/peter-mouland/kammy-proxy)

## Todo:
 - filter out PENDING: packages/helpers/player-stats/src/index.js
 - add `--local` flag and read from fixtures dir
 - use MSW for unit/integration testing
