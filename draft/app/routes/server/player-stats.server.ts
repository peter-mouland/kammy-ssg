// src/routes/server/player-stats.server.ts
// Server-only imports
import { fplApiCache } from "./fpl/api-cache";
import { readPlayers } from "./sheets/players";
import type { FplTeamData, PlayerData, EnhancedPlayerData, PlayerStatsData } from "../../types";
import { generateEnhancedData } from './scoring/generate-enhanced-data';

export async function getPlayerStatsData(): Promise<PlayerStatsData> {
    console.log('🟡 getPlayerStatsData() - Entry point reached');

    try {
        // Test Step 1 in isolation
        console.log('🔄 Testing Step 1: getFplPlayers...');
        let fplPlayers;
        try {
            fplPlayers = await fplApiCache.getFplPlayers();
            console.log(`✅ Step 1 SUCCESS: Got ${fplPlayers.length} players`);
        } catch (error) {
            console.error('❌ Step 1 FAILED:', error.message);
            throw new Error(`Step 1 failed: ${error.message}`);
        }

        // Test Step 2 in isolation
        console.log('🔄 Testing Step 2: getFplTeams...');
        let fplTeams;
        try {
            fplTeams = await fplApiCache.getFplTeams();
            console.log(`✅ Step 2 SUCCESS: Got ${fplTeams.length} teams`);
        } catch (error) {
            console.error('❌ Step 2 FAILED:', error.message);
            throw new Error(`Step 2 failed: ${error.message}`);
        }

        // Test Step 3 in isolation
        console.log('🔄 Testing Step 3: readPlayers...');
        let sheetsPlayers;
        try {
            sheetsPlayers = await readPlayers();
            console.log(`✅ Step 3 SUCCESS: Got ${sheetsPlayers.length} sheets players`);
        } catch (error) {
            console.error('❌ Step 3 FAILED:', error.message);
            throw new Error(`Step 3 failed: ${error.message}`);
        }

        // Don't even try step 4 yet - let's see if we get this far
        console.log('🎉 All initial steps completed successfully');

        const playerIds = fplPlayers.map(p => p.id);
        // const playerIds = [328] // fplPlayers.map(p => p.id);
        // fplPlayers = fplPlayers.filter((p) => p.id === 328)
        console.log(`🔄 About to fetch gameweek data for ${playerIds.length} players...`);

        let fplPlayerGameweeksById
        try {
            // This is likely where it's failing
            console.log(`🔄 Step 4: getBatchPlayerDetailedStats...`);
             fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);
            console.log(`✅ Got detailed stats for ${Object.keys(fplPlayerGameweeksById).length} players`);
        } catch (error) {
            console.error('❌ Step 4 FAILED:', error.message);
            throw new Error(`Step 4 failed: ${error.message}`);
        }

        // Create team lookup map
        const teams = fplTeams.reduce((acc: Record<number, string>, team: FplTeamData) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        // Create player lookup map from spreadsheet with better matching
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayerData>, player: PlayerData) => {
            acc[player.id] = player;
            return acc;
        }, {});

        console.log(`Created lookup for ${sheetsPlayers.length} players from spreadsheet`);
        console.log('generateEnhancedData...');

        // Enhance players with accurate points calculations using your existing logic
        const enhancedPlayers: EnhancedPlayerData[] = generateEnhancedData(fplPlayers, fplPlayerGameweeksById, sheetsPlayersById, teams)

        console.log('generateEnhancedData... finished');
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
        };   // ... rest of your code
    } catch (error) {
        console.error('❌ Error in getPlayerStatsData:', error);
        throw error;
    }
}
