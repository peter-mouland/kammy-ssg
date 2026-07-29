/* Location: app/leagues/index.server.ts */

/**
 * The leagues domain's SERVER-ONLY public API.
 *
 * Split from `index.ts` because both of these reach the Sheets readers and `fplApiCache`
 * (and `league-standings.server` reaches scoring's own server API on top of that).
 *
 * Rule of thumb: if it touches Firestore, Sheets or `process.env`, it goes here.
 */

// --- Standings ---------------------------------------------------------------
// Every division's table. The homepage loads this to render the dashboard.
export { getAllLeagueStandingsData } from './server/league-standings.server';
// --- Team of the week --------------------------------------------------------
// The best XI across a division for a gameweek. `teams` renders it on a team page —
// working out who had the best gameweek is a standings question, not a roster one.
export { getTeamOfTheWeek } from './server/team-of-the-week.server';
