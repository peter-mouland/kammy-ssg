I'm building a React Router v7 fantasy football draft application with Google Sheets as the database. I need a complete system with:
Core Requirements:

React Router v7 with TypeScript, Vite, and server-side rendering
Google Sheets API integration using base64-encoded service account credentials
Division-based league system where each manager belongs to a division
Draft system where each division drafts separately with pre-determined random order
Real-time draft interface with Server-Sent Events
FPL (Fantasy Premier League) API integration for live player data

Google Sheets Structure:

Divisions sheet: ID, Label, Order
UserTeams sheet: User ID, User Name, Team Name, FPL ID, Division ID, Current GW Points, Total Points, Overall Rank, League Rank, Last Updated
WeeklyPoints sheet: User ID, Gameweek, Points, Transfers, Hits, Captain, Vice Captain, Bench Boost, Triple Captain, Wildcard, Free Hit, Date Recorded
Draft sheet: Pick Number, Round, User ID, Player ID, Player Name, Team, Position, Price, Picked At, Division ID
DraftState sheet: Is Active, Current Pick, Current User ID, Current Division ID, Total Rounds, Picks Per Team, Started At, Completed At
DraftOrder sheet: Division ID, Position, User ID, User Name, Generated At

Key Features:

Header-based Google Sheets parsing (not column position dependent)
Division-based draft order generation with randomization
Snake draft within divisions, sequential drafting between divisions
Real-time player search/filtering during draft
Live draft status and turn management
Draft order management interface separate from live draft interface

Pages Needed:

/ - Dashboard with top FPL players and mini league standings
/my-team - League management with division filtering
/draft - Live draft interface with player selection
/generate-draft - Draft order management and generation

API Endpoints:

/api/sheets - Google Sheets CRUD operations
/api/user-data - User team data management
/api/divisions - Division management
/api/draft - Draft state, picks, and available players
/api/live-scores - Server-Sent Events for real-time updates

Create the complete file structure with robust error handling, TypeScript interfaces, and modern React patterns. Use atob() for base64 credential parsing and ensure all variable names are unique to avoid conflicts.
