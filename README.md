# Kammy-ssg

 > Static Site Generator for Kammy Draft Fantasy Football

Uses [Gatsby](https://www.gatsbyjs.com/docs/) and [GatsbyCloud](https://www.gatsbyjs.com/dashboard) to generate the build, which is hosted on [netlify](https://app.netlify.com/teams/peter-mouland/sites) and visible at [draftff.netlify.com](http://draftff.netlify.com/)

## Local Dev

 - `yarn start` : use latest sky/google data
 - `FIXTURE=2223 yarn start` : use local fixtures

### .env.developer file

```shell
IS_LOCAL=true
SPREADSHEET_ACCESS_KEY=REDACTED

#PROXY_HOST=https://kammy-proxy.herokuapp.com
PROXY_HOST=http://localhost:3000
URL=http://localhost:8888
NODE_TLS_REJECT_UNAUTHORIZED=0;
PATH_PREFIX=/
ASSET_PREFIX=/

SAVE=false # save remote fixtures locally [false || 2223]
FIXTURES=false # where to save and read local fixture from. [false || 2223]

```

## Deployment

### Netlify

> yarn deploy

You must have the correct environment variables; for netlify these are
 - PATH_PREFIX=/
 - ASSET_PREFIX=https://draftff.netlify.app/


### Gatsby

> yarn start

You must have the correct environment variables; for Gatsby these are
 - PATH_PREFIX=/kammy-ssg
 - ASSET_PREFIX=/


## Data Sources

 - Fetches data via the [rest v4 API](https://developers.google.com/sheets/api)
 - Saving data via [kammy-proxy project](http://github.com/peter-mouland/kammy-proxy)
 - Data source is https://fantasy.premierleague.com/api/
   - [more info on api](https://medium.com/@frenzelts/fantasy-premier-league-api-endpoints-a-detailed-guide-acbd5598eb19)

## Season Prep
 - ensure spreadhseets a 'published to web' to keep the REST response fresh
 - create '[Filter Views](https://developers.google.com/sheets/api/guides/filters)' of the transfer pages for 'Pending Transfers'

## Todo:
 - create data sources
   - create new v2 graph-tables w/ minimal mutations + manipulations
   - create new v2 pages to replace current
   - use static queries using new data sources using tanstack-query + selectors
 - merge events + gameWeeks
   - { ...events, isCup }
   - use date as end date
   - is start_date needed with is_current and finished?
   - remove jsonQuery code + dep
 - create **use-events** `{ id, event_name, end, is_current etc}` (instead of game-weeks)
 - create **use-players** `(playerId?, teamId?) { id, web_name, team_code }`
 - create **use-teams**  `(teamId?) { id, name, short_name }`
 - create **use-fixtures** `(eventId?, playerId?, teamId?) { id, event_id }`
 - create **use-stats** `(eventId?, playerId?) { id, event_id }`
 - Use fplTeams as source instead of manual loops + mutations
   - create graphql function to return { id, name, short_name, fixtures?, players? }

## Legacy Todo:
 - remove stats from players who wont score points
     - remove this : 'calculateTotalPoints({ stats: { [stat]: 9 }, pos })'
     - removing the stat from the source data should be faster
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
