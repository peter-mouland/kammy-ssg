/* Location: app/_shared/lib/firestore-cache/fpl-cache.ts */
/* Responsibility: */
/* - store fantasy.premierleague.com data into firestore */
/* - give access to fantasy.premierleague.com data from firestore */
/* Notes: */
/* - 90% of use-case should use api-cache*/

import { generateSeasonData } from '../../../scoring/lib';
import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import type { PlayersSheetData } from '../../types/sheets-types';
import { processBatched, processBatchedReads } from '../batch-processor';
import { FirestoreClearService } from '../firestore-cache/clear-service';
import { FirestoreClient } from '../firestore-cache/firestore-client';
import { readPlayers } from '../sheets/players';
import { fplApi } from './api';
import type {
    EventData,
    FilteredFplPlayerData,
    FplPlayerData,
    FplPlayerGameweekData,
    FplPlayerSeasonData,
    FplTeam,
    GameWeekData,
} from './fpl-types';
import { getGameweekData } from './gameweeks';

export const convertFplElementToCache = (element: FplPlayerData, teamsByCode: Record<number, FplTeam>) => ({
    id: element.id,
    code: element.code,
    first_name: element.first_name,
    second_name: element.second_name,
    web_name: element.web_name,
    team_code: element.team_code,
    team_name: teamsByCode[element.team_code],
    form: element.form,
    now_cost: element.now_cost,
});

export const convertFplElementHistoryToCache = (element: FplPlayerGameweekData) => ({
    element: element.element,
    round: element.round,
    fixture: element.fixture,
    assists: element.assists,
    bonus: element.bonus,
    clean_sheets: element.clean_sheets,
    goals_conceded: element.goals_conceded,
    goals_scored: element.goals_scored,
    minutes: element.minutes,
    own_goals: element.own_goals,
    penalties_saved: element.penalties_saved,
    penalties_missed: element.penalties_missed,
    red_cards: element.red_cards,
    saves: element.saves,
    yellow_cards: element.yellow_cards,
    team_a_score: element.team_a_score,
    team_h_score: element.team_h_score,
});

export class FplFirestore {
    private client: FirestoreClient;
    public clearService: FirestoreClearService;
    public lastUpdated = {
        teams: '',
        elements: '',
        elementDetailedStats: '',
        events: '',
    };

    constructor() {
        this.client = new FirestoreClient();
        this.clearService = new FirestoreClearService();
    }

    // === READ METHODS ===

    /**
     * Get teams from cache
     */
    async getTeams(): Promise<FplTeam[]> {
        const doc = await this.client.getDocument<FplTeam[]>(this.client.collections.FPL_BOOTSTRAP, 'teams');
        this.lastUpdated.teams = doc?.lastUpdated || '';
        return doc ? doc.data : [];
    }

    /**
     * Get events from cache
     */
    async getEvents(): Promise<GameWeekData[]> {
        const doc = await this.client.getDocument<GameWeekData[]>(this.client.collections.FPL_BOOTSTRAP, 'events');
        this.lastUpdated.events = doc?.lastUpdated || '';

        return doc ? doc.data.map((gw) => ({ ...gw, start: gw.start.toDate(), end: gw.end.toDate() })) : [];
    }

    /**
     * Get elements from cache
     */
    async getElements(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 getElements() - Reading from Firestore...');
        const doc = await this.client.getDocument<EnhancedPlayerData[]>(
            this.client.collections.FPL_BOOTSTRAP,
            'elements',
        );
        this.lastUpdated.elements = doc?.lastUpdated || '';
        return doc ? doc.data : [];
    }

    /**
     * Batch get element summaries
     */

    async getBatchPlayerDetailedStats(playerId: number[]) {
        const playerIds = Array.isArray(playerId) ? playerId : [playerId];

        const docIds = playerIds.map((id) => `element-${id}`);
        const docs = await this.client.batchGetDocuments(this.client.collections.FPL_ELEMENTS, docIds);

        const results: Record<number, FplPlayerSeasonData> = {};
        playerIds.forEach((playerId, index) => {
            if (docs[index]?.data) {
                results[playerId] = docs[index].data;
            }
        });

        return results;
    }

    async getPlayerDetailedStats(playerId: number) {
        const doc = await this.client.getDocument(this.client.collections.FPL_ELEMENTS, `element-${playerId}`);
        return doc;
    }

    // === HELPER METHODS ===

    /**
     * Update elements with draft data
     */
    async updateElementsWithDraft(draftDataById: Record<number, EnhancedPlayerData>): Promise<void> {
        const elements = await this.getElements();
        if (!elements) {
            throw new Error('No elements found to update with draft data');
        }

        // Add draft data to each element
        const updatedElements = elements.map((element) => {
            const draftData = draftDataById[element.id];
            if (draftData) {
                return {
                    ...element,
                    draft: draftData.draft,
                };
            }
            return element;
        });

        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'elements', {
            lastUpdated: new Date().toISOString(),
            source: 'fpl-with-draft',
            data: updatedElements,
        });
    }

    // === WRITE METHODS ===
    /**
     * Generate and cache enhanced data
     */
    private async generateAndCacheEnhancedData(): Promise<EnhancedPlayerData[]> {
        console.log('🔄 generateAndCacheEnhancedData() - Starting fresh generation...');

        // Get base FPL data
        const players = await this.getElements();
        const sheetsPlayers = await readPlayers();

        // Filter to only players that exist in sheets
        const playerIds: number[] = [];
        const sheetsPlayersById = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
            acc[player.id] = player;
            playerIds.push(player.id);
            return acc;
        }, {});
        const filteredPlayers = players.filter((player) => sheetsPlayersById[player.id]);
        const fplPlayerGameweeksById = await this.getBatchPlayerDetailedStats(playerIds);

        if (filteredPlayers.length === 0) {
            throw new Error('No players found that exist in both FPL data and sheets');
        }

        console.log(`🔄 Generating enhanced data for ${filteredPlayers.length} players...`);

        const enhancedPlayers = generateSeasonData(filteredPlayers, fplPlayerGameweeksById, sheetsPlayersById);
        const playersById = enhancedPlayers.reduce((acc: Record<string, EnhancedPlayerData>, player) => {
            acc[player.id] = player;
            return acc;
        }, {});
        await this.updateElementsWithDraft(playersById);

        console.log(`✅ Enhanced data generated and cached for ${enhancedPlayers.length} players`);
        return enhancedPlayers;
    }

    /**
     * Preload common data based on what's missing
     */
    async preloadCommonData() {
        console.log('🔄 preloadCommonData()');

        const results: any = {};

        try {
            const sheetsPlayers = await readPlayers();
            const playerIds = sheetsPlayers.map((p: any) => p.id);

            // ensure db is clean
            await this.clearBootstrapData();
            await this.clearElementDetailedStats();

            // populate base db info
            results.bootstrap = await this.populateBootstrap();
            results.enhanced = await this.generateAndCacheEnhancedData();
            results.elementDetailedStats = await this.populatePlayerDetailedStats(playerIds);

            return {
                success: true,
                results,
            };
        } catch (error) {
            console.error('❌ preloadCommonData() - Error:', error);
            throw error;
        }
    }
    /**
     * Populate teams document with fresh data
     */
    async populateTeams(teamsData: any[]) {
        console.log('🎉 Populating FPL_BOOTSTRAP teams document with fresh data...');
        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'teams', {
            lastUpdated: new Date().toISOString(),
            source: 'fpl',
            data: teamsData,
        });
        return teamsData;
    }

    /**
     * Populate events document with fresh data
     */
    async populateEvents(eventsData: EventData[]) {
        console.log('🎉 Populating FPL_BOOTSTRAP events document with fresh data...');
        const gameweekData = getGameweekData(eventsData);
        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'events', {
            lastUpdated: new Date().toISOString(),
            source: 'fpl',
            data: gameweekData,
        });
        return gameweekData;
    }

    /**
     * Populate elements document with fresh data (minimal fields only)
     */
    async populateElements(elementsData: FplPlayerData[], teams) {
        console.log('🎉 Populating FPL_BOOTSTRAP elements document with fresh data...');
        const teamsByCode = teams.reduce((acc, e) => ({ ...acc, [e.code]: e }), {});
        const filteredElements: FilteredFplPlayerData[] = elementsData.map((e) =>
            convertFplElementToCache(e, teamsByCode),
        );

        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'elements', {
            lastUpdated: new Date().toISOString(),
            source: 'fpl',
            data: filteredElements,
        });
        return filteredElements;
    }

    /**
     * Populate all bootstrap documents with fresh data (chunked for large payloads)
     */
    async populateBootstrap() {
        const bootstrapData = await fplApi.getFplBootstrapData();
        const teams = await this.populateTeams(bootstrapData.teams);
        const events = await this.populateEvents(bootstrapData.events);
        const elements = await this.populateElements(bootstrapData.elements, bootstrapData.teams);
        return { teams, events, elements };
    }

    /**
     * Populate multiple element summary documents with fresh data
     */
    async populatePlayerDetailedStats(playerIds: number[]): Promise<Record<number, FplPlayerSeasonData>> {
        console.log(`🔄 populatePlayerDetailedStats([${playerIds.length} players]) - Start`);

        // Fetch missing players from API in manageable chunks
        const freshData: Record<number, FplPlayerSeasonData> = {};

        if (playerIds.length > 0) {
            const fetchPlayer = async (playerId: number) => {
                try {
                    const playerData = await fplApi.getPlayerDetailedStats(playerId);
                    return { playerId, playerData };
                } catch (error) {
                    console.error(`Failed to fetch player ${playerId}:`, error);
                    return { playerId, playerData: null };
                }
            };

            const results = await processBatched(playerIds, fetchPlayer, {
                batchSize: 50,
                maxConcurrent: 10,
                logProgress: true,
            });

            // Convert results to freshData object
            results.forEach(({ playerId, playerData }) => {
                if (playerData) {
                    freshData[playerId] = playerData;
                }
            });
            await this.populateElementDetailedStats(freshData);
            return freshData;
        }
        return {};
    }

    // todo : batch to reduce cost
    // todo : restrict to id in sheeets
    async populateElementDetailedStats(summariesData: Record<number, any>): Promise<void> {
        const entries = Object.entries(summariesData);
        console.log(`📝 Writing ${entries.length} element summaries individually to avoid payload limits`);

        for (const [playerIdStr, data] of entries) {
            console.log(`📝 ... ${playerIdStr}`);
            await this.client.setDocument(this.client.collections.FPL_ELEMENTS, `element-${playerIdStr}`, {
                lastUpdated: new Date().toISOString(),
                source: 'fpl' as const,
                data,
            });
        }

        console.log(`✅ Successfully wrote ${entries.length} element summaries`);
    }

    /**
     * Get count of teams in cache
     */
    async getTeamsCount(): Promise<number> {
        try {
            const teams = await this.getTeams();
            return teams?.length || 0;
        } catch (error) {
            console.error('Error getting teams count:', error);
            return 0;
        }
    }

    /**
     * Get count of events in cache
     */
    async getEventsCount(): Promise<number> {
        try {
            const events = await this.getEvents();
            return events?.length || 0;
        } catch (error) {
            console.error('Error getting events count:', error);
            return 0;
        }
    }

    /**
     * Get count of elements in cache
     */
    async getElementsCount(): Promise<number> {
        try {
            const elements = await this.getElements();
            return elements?.length || 0;
        } catch (error) {
            console.error('Error getting elements count:', error);
            return 0;
        }
    }

    /**
     * Get count of element summaries in cache
     */
    async getElementDetailedStatsCount(): Promise<number> {
        try {
            // This depends on your Firestore structure
            // You might need to query the collection directly
            const snapshot = await this.client.db.collection(this.client.collections.FPL_ELEMENTS).count().get();
            return snapshot.data().count;
        } catch (error) {
            console.error('Error getting element summaries count:', error);
            return 0;
        }
    }

    /**
     * Clear bootstrap data
     */
    async clearBootstrapData(): Promise<void> {
        console.log('⚪️ Clearing bootstap document with fresh data...');
        try {
            await this.clearService.clearCollection(this.client.collections.FPL_BOOTSTRAP);
            console.log('✅ Bootstrap data cleared');
        } catch (error) {
            console.error('❌ Error clearing bootstrap data:', error);
            throw error;
        }
    }

    /**
     * Clear element summaries
     */
    async clearElementDetailedStats(): Promise<void> {
        try {
            await this.clearService.clearCollection(this.client.collections.FPL_ELEMENTS);
            console.log('✅ Element summaries cleared');
        } catch (error) {
            console.error('❌ Error clearing element summaries:', error);
            throw error;
        }
    }
}
