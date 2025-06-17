/* Location: app/teams/server/team.server.ts */

// /teams/server/team.server.ts
import { getFirestoreInstance } from '../../_shared/lib/firestore-cache/firebase.admin';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getUserTeamsByDivision } from '../../_shared/lib/sheets/user-teams';
import type { TeamViewData, TeamData, CurrentUser, Division } from '../types';

export async function loadTeamData(url: URL, params: any): Promise<TeamViewData> {
    try {
        // Get current user from session/auth (you'll need to implement this)
        const currentUser = await getCurrentUser(url);
        if (!currentUser) {
            throw new Error("User not authenticated");
        }

        // Get user's division
        const divisions = await readDivisions();
        const userTeams = await getUserTeamsByDivision(currentUser.divisionId);
        const userTeam = userTeams.find(team => team.userId === currentUser.id);

        if (!userTeam) {
            throw new Error("User team not found");
        }

        const division = divisions.find(d => d.id === userTeam.divisionId);
        if (!division) {
            throw new Error("Division not found");
        }

        // Get current gameweek (you might want to get this from your game state)
        const currentGameweek = await getCurrentGameweek();

        // Get team data from Firestore
        const currentTeam = await getTeamForGameweek(userTeam.divisionId, currentGameweek);

        // Get historical team data
        const gameweekHistory = await getTeamHistory(userTeam.divisionId, currentUser.id);

        // Get available gameweeks
        const availableGameweeks = getAvailableGameweeks(gameweekHistory, currentGameweek);

        return {
            currentUser: {
                id: currentUser.id,
                userName: userTeam.userName,
                teamName: userTeam.teamName
            },
            division: {
                id: division.id,
                name: division.name
            },
            currentGameweek,
            currentTeam,
            gameweekHistory,
            availableGameweeks
        };

    } catch (error) {
        console.error('Load team data error:', error);
        throw new Error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function getCurrentUser(url: URL): Promise<{ id: string; divisionId: string } | null> {
    // TODO: Implement authentication logic
    // This should get the current user from session/cookies/auth
    // For now, return a mock user - replace with your auth system
    const userId = url.searchParams.get('userId') || 'naked';
    const divisionId = url.searchParams.get('divisionId') || 'leagueOne';

    return {
        id: userId,
        divisionId: divisionId
    };
}

async function getCurrentGameweek(): Promise<number> {
    // TODO: Implement gameweek logic
    // This should get the current gameweek from your game state
    // For now, return a mock value
    return 5;
}

async function getTeamForGameweek(divisionId: string, gameweek: number): Promise<TeamData> {
    try {
        const db = getFirestoreInstance();
        const docRef = db.collection('division-teams').doc(divisionId);

        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`No teams found for division ${divisionId}`);
        }

        const data = doc.data();

        // If requesting current gameweek, return current data
        if (gameweek === data.gameweek) {
            const allPlayers: any[] = [];

            // Flatten all players from all teams for the current user
            Object.values(data.teams).forEach((teamPlayers: any) => {
                allPlayers.push(...teamPlayers);
            });

            return {
                gameweek: data.gameweek,
                players: allPlayers,
                lastUpdated: data.lastUpdated
            };
        }

        // For historical data, we'd need to implement versioning
        // For now, return current data but with requested gameweek
        const allPlayers: any[] = [];
        Object.values(data.teams).forEach((teamPlayers: any) => {
            allPlayers.push(...teamPlayers.map((p: any) => ({ ...p, gameweek })));
        });

        return {
            gameweek,
            players: allPlayers,
            lastUpdated: data.lastUpdated
        };

    } catch (error) {
        console.error('Get team for gameweek error:', error);
        throw new Error(`Failed to get team for gameweek ${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function getTeamHistory(divisionId: string, userId: string): Promise<TeamData[]> {
    try {
        // TODO: Implement proper historical data storage
        // For now, return mock historical data
        const currentTeam = await getTeamForGameweek(divisionId, await getCurrentGameweek());

        // Generate mock historical data for demonstration
        const history: TeamData[] = [];
        for (let gw = 0; gw <= await getCurrentGameweek(); gw++) {
            // Filter players for this specific user
            const userPlayers = currentTeam.players.filter(p => p.userId === userId);

            history.push({
                gameweek: gw,
                players: userPlayers.map(p => ({ ...p, gameweek: gw })),
                lastUpdated: currentTeam.lastUpdated
            });
        }

        return history;

    } catch (error) {
        console.error('Get team history error:', error);
        throw new Error(`Failed to get team history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function getAvailableGameweeks(history: TeamData[], currentGameweek: number): number[] {
    // Get unique gameweeks from history, ensuring we include 0 (draft) and current
    const gameweeks = new Set([0, currentGameweek]);

    history.forEach(team => {
        gameweeks.add(team.gameweek);
    });

    return Array.from(gameweeks).sort((a, b) => a - b);
}

// Utility function to get specific user's team from division data
export async function getUserTeamFromDivision(divisionId: string, userId: string, gameweek?: number): Promise<TeamData | null> {
    try {
        const db = getFirestoreInstance();
        const docRef = db.collection('division-teams').doc(divisionId);

        const doc = await docRef.get();
        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        const userTeam = data.teams[userId];

        if (!userTeam) {
            return null;
        }

        return {
            gameweek: gameweek || data.gameweek,
            players: userTeam,
            lastUpdated: data.lastUpdated
        };

    } catch (error) {
        console.error('Get user team from division error:', error);
        return null;
    }
}
