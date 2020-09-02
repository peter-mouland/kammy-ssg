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
 - improve transfer page
     - fix transfer comment box
     - fix transfer time display from google-sheets
     - update time on transfer page in real-time
     - show players selected + options
     - add 'bin' button (on left) to delete transfers
     - add 'you have x transfers remaining' message
     - disable button if too many transfers
     - improve transfer page filters
 - fix teams page 'position timeline'
 - fix 'sticky' headers. ffs.
 - remove 'popup' with 'drawer'
 - move from BEM to css-modules
 - standard game-week switcher (pills) vs game-week calendar
 - filter out PENDING: packages/helpers/player-stats/src/index.js
 - add `--local` flag and read from fixtures dir
 - use MSW for unit/integration testing
 - remove main nav 'drop-down' menus, replace with in-page 'tabs'
 - add 'more' button in main nav for 'rules' + 'prize money'
 - improve player table, move 'pos' 'player' 'club' into single column with photo
 - add service worker for offline
 - add manifest for pwa
