// Server-only imports
import { getFplBootstrapData, getBatchPlayerGameweekData } from "./fpl/api";
import { readPlayers } from "./sheets/players";
import { calculateSeasonPoints } from "../lib/points";
import type { FplPlayerData, FplTeamData, PlayerData, CustomPosition, PlayerGameweekStatsData } from "../types";
import type { FplPlayerGameweekData } from "./fpl/api";


export interface PlayerStatsData {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Record<number, string>;
}

export interface EnhancedPlayerData extends FplPlayerData {
    team_name: string;
    position_name: string; // Custom position: ca, wa, mid, fb, cb, gk
    custom_points: number;
    points_breakdown: any; // Points breakdown from your points logic
    player_info?: PlayerData; // Additional info from spreadsheet
    gameweek_data?: FplPlayerGameweekData[]; // Per-game data
}

// Convert FPL gameweek data to your format
const convertToPlayerGameweekStats = (gameweekData: FplPlayerGameweekData[]): PlayerGameweekStatsData[] => {
    return gameweekData.map(gw => ({
        gameweek: gw.round,
        minutesPlayed: gw.minutes,
        goals: gw.goals_scored,
        assists: gw.assists,
        cleanSheets: gw.clean_sheets,
        goalsConceded: gw.goals_conceded,
        yellowCards: gw.yellow_cards,
        redCards: gw.red_cards,
        saves: gw.saves,
        bonus: gw.bonus
    }));
};

export async function getPlayerStatsData(): Promise<PlayerStatsData> {
    const [bootstrapData, playersData] = await Promise.all([
        getFplBootstrapData(),
        readPlayers()
    ]);

    console.log('Fetching gameweek data for all players...');

    // Get all player IDs (limit to top players to avoid rate limits during development)
    const playerIds = bootstrapData.elements
        .filter(p => p.total_points > 10) // Only get players with some points to reduce API calls
        .map(p => p.id);

    console.log(`Fetching gameweek data for ${playerIds.length} players...`);
    console.log(`Found ${playersData.length} players in spreadsheet`);
    console.log('Sample spreadsheet players:', playersData.slice(0, 3).map(p => `${p.firstName} ${p.lastName} - ${p.position}`));

    // Fetch gameweek data for all players (with rate limiting)
    const gameweekDataMap = await getBatchPlayerGameweekData(playerIds, 50); // 50ms delay between requests

    console.log(`Retrieved gameweek data for ${Object.keys(gameweekDataMap).length} players`);

    // Create team lookup map
    const teams = bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
        acc[team.id] = team.name;
        return acc;
    }, {});

    // Create player lookup map from spreadsheet with better matching
    const playersLookup = playersData.reduce((acc: Record<string, PlayerData>, player: PlayerData) => {
        acc[player.id] = player;
        return acc;
    }, {});

    console.log(`Created lookup for ${playersData.length} players from spreadsheet`);
    console.log('Sample lookup keys:', Object.keys(playersLookup).slice(0, 10));

    // Enhance players with accurate points calculations using your existing logic
    const enhancedPlayers: EnhancedPlayerData[] = bootstrapData.elements.map((player: FplPlayerData) => {
        // Try to find custom player data with multiple matching strategies
        const playerSheet = playersLookup[player.id]; // FPL ID match
        if (!playerSheet) {
            // player in bootstrap, not in spreadsheet
            return {
                ...player,
                team_name: '', position_name: '', custom_points: 0, points_breakdown: {}
            };
        }

        console.log(`Player ${player.web_name}: FPL ID ${player.id}, Found custom data:`, playerSheet ? `${playerSheet.firstName} ${playerSheet.lastName} - ${playerSheet.position}` : 'No match');

        // Get gameweek data and convert to your format
        const gameweekData = gameweekDataMap[player.id]?.history || [];
        const playerGameweekStats = convertToPlayerGameweekStats(gameweekData);

        // Calculate points using your existing logic
        const pointsBreakdown = calculateSeasonPoints(playerGameweekStats, playerSheet.position.toLowerCase() as CustomPosition);

        console.log(`Final position for ${player.web_name}: ${playerSheet.position}`);

        return {
            ...player,
            team_name: teams[player.team] || `Team ${player.team}`,
            position_name: playerSheet.position, // This should now be the custom position
            custom_points: pointsBreakdown.total,
            points_breakdown: pointsBreakdown,
            player_info: playerSheet,
            gameweek_data: gameweekData
        };
    });

    return {
        players: enhancedPlayers,
        teams,
        positions: {
            'gk': 'gk',
            'cb': 'cb',
            'fb': 'fb',
            'mid': 'mid',
            'wa': 'wa',
            'ca': 'ca'
        }
    };
}
