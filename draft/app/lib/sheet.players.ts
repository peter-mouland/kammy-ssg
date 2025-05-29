import { parseSheetWithHeaders, getFieldValue, getNumericFieldValue, getFloatFieldValue } from './sheets.common';

export interface CustomPlayer {
    id: number;                    // YOUR custom player ID
    name: string;                  // Player name
    team: string;                  // Team name
    position: string;              // YOUR custom position
    code: string;                  // Link to FPL player code
    price?: number;                // Optional price
    total_points?: number;         // Points from FPL (fetched via code)
    is_drafted: boolean;           // Draft status
    fpl_data?: {                   // Additional FPL data
        fpl_id: number;
        fpl_team: string;
        fpl_position: string;        // FPL's position (for reference only)
        selected_by_percent: string;
        event_points: number;
    };
}

const SHEET_NAME = 'Players';
const HEADERS = ['ID', 'Name', 'Team', 'Position', 'Code', 'Price'];

// Get custom players from YOUR Players sheet
export async function getCustomPlayers(): Promise<CustomPlayer[]> {
    try {
        return await parseSheetWithHeaders(SHEET_NAME, (rowData) => ({
            id: getNumericFieldValue(rowData, 'ID', ['id']),
            name: getFieldValue(rowData, 'Name', ['name']),
            team: getFieldValue(rowData, 'Team', ['team']),
            position: getFieldValue(rowData, 'Position', ['position']), // YOUR position
            code: getFieldValue(rowData, 'Code', ['code']),             // FPL link
            price: getFloatFieldValue(rowData, 'Price', ['price']) || 0,
            total_points: 0, // Will be populated from FPL
            is_drafted: false,
        }));
    } catch (error) {
        console.error('Error reading custom players:', error);
        return [];
    }
}

// Get custom players enriched with FPL data
export async function getCustomPlayersWithFPLData(): Promise<CustomPlayer[]> {
    try {
        // Get your custom player data
        const customPlayers = await getCustomPlayers();

        // Get FPL data
        const fplResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
        const fplData = await fplResponse.json();

        // Create lookup map by FPL code
        const fplPlayerMap = new Map();
        fplData.elements.forEach((player: any) => {
            fplPlayerMap.set(player.code.toString(), player);
        });

        // Get FPL teams for team names
        const fplTeamMap = new Map();
        fplData.teams.forEach((team: any) => {
            fplTeamMap.set(team.id, team);
        });

        // Enrich custom players with FPL data
        const enrichedPlayers = customPlayers.map(customPlayer => {
            const fplPlayer = fplPlayerMap.get(customPlayer.code);
            const fplTeam = fplPlayer ? fplTeamMap.get(fplPlayer.team) : null;

            return {
                ...customPlayer,
                total_points: fplPlayer?.total_points || 0,
                price: fplPlayer ? fplPlayer.now_cost / 10 : customPlayer.price, // FPL price in £m
                fpl_data: fplPlayer ? {
                    fpl_id: fplPlayer.id,
                    fpl_team: fplTeam?.short_name || '',
                    fpl_position: ['', 'GKP', 'DEF', 'MID', 'FWD'][fplPlayer.element_type] || '',
                    selected_by_percent: fplPlayer.selected_by_percent,
                    event_points: fplPlayer.event_points,
                } : null,
            };
        });

        return enrichedPlayers;
    } catch (error) {
        console.error('Error getting custom players with FPL data:', error);
        return [];
    }
}

// Get player by ID
export async function getCustomPlayerById(id: number): Promise<CustomPlayer | null> {
    const players = await getCustomPlayers();
    return players.find(player => player.id === id) || null;
}

// Get players by position
export async function getCustomPlayersByPosition(position: string): Promise<CustomPlayer[]> {
    const players = await getCustomPlayersWithFPLData();
    return players.filter(player => player.position === position);
}

// Get players by team
export async function getCustomPlayersByTeam(team: string): Promise<CustomPlayer[]> {
    const players = await getCustomPlayersWithFPLData();
    return players.filter(player => player.team === team);
}

// Get all unique positions
export async function getCustomPlayerPositions(): Promise<string[]> {
    const players = await getCustomPlayers();
    const positions = [...new Set(players.map(player => player.position))];
    return positions.filter(position => position).sort();
}

// Get all unique teams
export async function getCustomPlayerTeams(): Promise<string[]> {
    const players = await getCustomPlayers();
    const teams = [...new Set(players.map(player => player.team))];
    return teams.filter(team => team).sort();
}

export { SHEET_NAME as PLAYERS_SHEET_NAME, HEADERS as PLAYERS_HEADERS };
