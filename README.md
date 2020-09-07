# Kammy-ssg

 > Static Site Generator for Kammy Draft Fantasy Football

Uses [Gatsby](https://www.gatsbyjs.com/docs/) and [GatsbyCloud](https://www.gatsbyjs.com/dashboard) to generate the build, which is hosted on [netlify](https://app.netlify.com/teams/peter-mouland/sites) and visible at [draftff.netlify.com](http://draftff.netlify.com/)

## Local Dev

 - `yarn start` : use latest sky/google data
 - `FIXTURE=1920 yarn start` : use local fixtures
 - or `yarn dev` (wip: using 'netlify functions')

## Data Sources

 - Fetches data via the [rest v4 API](https://developers.google.com/sheets/api)
 - Saving data via [kammy-proxy project](http://github.com/peter-mouland/kammy-proxy)

## Season Prep
 - ensure spreadhseets a 'published to web' to keep the REST response fresh
 - create '[Filter Views](https://developers.google.com/sheets/api/guides/filters)' of the transfer pages for 'Pending Transfers'

## Todo:
 - Cup page:
    - add use-current-team hook
    - confirm `{ pendingTransfers } = use-transfers` works
 - only build for past, current, and +1 GameWeek
 - improve transfer page
     - update time on transfer page in real-time
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
