// Server-only imports
import { getFplBootstrapData, getBatchPlayerGameweekData } from "./fpl/api";
import { readPlayers } from "./sheets/players";
import { calculateSeasonPoints, getFullBreakdown } from '../../lib/points';
import type { FplPlayerData, FplTeamData, PlayerData, CustomPosition, PlayerGameweekStatsData, EnhancedPlayerData, PlayerStatsData } from "../../types";
import { convertToPlayerGameweeksStats } from "./fpl/stats";
import { generateEnhancedData } from './scoring/generate-enhanced-data';


export async function getPlayerStatsData(): Promise<PlayerStatsData> {
    const [fplBootstrap, sheetsPlayers] = await Promise.all([
        getFplBootstrapData(),
        readPlayers()
    ]);

    console.log('Fetching gameweek data for all players...');

    // Get all player IDs (limit to top players to avoid rate limits during development)
    const playerIds = fplBootstrap.elements
        .filter(p => p.total_points > 0) // Only get players with some points to reduce API calls
        .map(p => p.id);

    console.log(`Fetching gameweek data for ${playerIds.length} players...`);
    console.log(`Found ${sheetsPlayers.length} players in spreadsheet`);
    console.log('Sample spreadsheet players:', sheetsPlayers.slice(0, 3).map(p => `${p.firstName} ${p.lastName} - ${p.position}`));

    // Fetch gameweek data for all players (with rate limiting)
    const fplPlayerGameweeksById = await getBatchPlayerGameweekData(playerIds, 50); // 50ms delay between requests

    console.log(`Retrieved gameweek data for ${Object.keys(fplPlayerGameweeksById).length} players`);

    // Create team lookup map
    const teams = fplBootstrap.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
        acc[team.id] = team.name;
        return acc;
    }, {});

    // Create player lookup map from spreadsheet with better matching
    const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayerData>, player: PlayerData) => {
        acc[player.id] = player;
        return acc;
    }, {});

    console.log(`Created lookup for ${sheetsPlayers.length} players from spreadsheet`);
    console.log('Sample lookup keys:', Object.keys(sheetsPlayersById).slice(0, 10));

    // Enhance players with accurate points calculations using your existing logic
    const enhancedPlayers: EnhancedPlayerData[] = generateEnhancedData(fplBootstrap, fplPlayerGameweeksById, sheetsPlayersById, teams)

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
