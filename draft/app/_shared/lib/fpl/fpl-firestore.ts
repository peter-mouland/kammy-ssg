/* Location: app/_shared/lib/firestore-cache/fpl-cache.ts */

import type { CustomPosition } from '../../../players/types/player-types';
import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import { processBatchedReads } from '../batch-processor';
import { FirestoreClearService } from '../firestore-cache/clear-service';
import { FirestoreClient } from '../firestore-cache/firestore-client';
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

export const convertFplElementToCache = (element: FplPlayerData) => ({
    id: element.id,
    code: element.code,
    first_name: element.first_name,
    second_name: element.second_name,
    web_name: element.web_name,
    team_code: element.team_code,
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

        return doc ? doc.data : [];
    }

    /**
     * Get events from cache
     */
    async getEvents(): Promise<GameWeekData[]> {
        const doc = await this.client.getDocument<GameWeekData[]>(this.client.collections.FPL_BOOTSTRAP, 'events');

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
        return doc ? doc.data : [];
    }

    /**
     * Get current gameweek from cached events
     */
    async getCurrentGameweek(): Promise<number | null> {
        const events = await this.getEvents();
        if (!events) return null;

        const currentEvent = events.find((event) => event.fplEvent.is_current);
        return currentEvent?.fplEvent.id || null;
    }

    /**
     * Get element summary data (individual player gameweek breakdown)
     */
    async getElementGameweeks(playerId: number): Promise<FplPlayerSeasonData | null> {
        const doc = await this.client.getDocument<FplPlayerSeasonData>(
            this.client.collections.FPL_ELEMENTS,
            `element-${playerId}`,
        );

        return doc ? doc.data : null;
    }

    /**
     * Batch get element summaries
     */

    async batchGetElementSummaries(playerIds: number[]) {
        const batchReader = async (playerIdBatch: number[]) => {
            const docIds = playerIdBatch.map((id) => `element-${id}`);
            const docs = await this.client.batchGetDocuments(this.client.collections.FPL_ELEMENTS, docIds);

            // Return tuples of [playerId, docData] for easier processing
            return playerIdBatch.map((playerId, index) => ({
                playerId,
                data: docs[index]?.data || null,
            }));
        };

        const batchResults = await processBatchedReads(playerIds, batchReader, {
            batchSize: 250, // Adjust based on document sizes
            logProgress: true,
        });

        // Convert array of results back to Record format
        const results: Record<number, any> = {};
        batchResults.forEach(({ playerId, data }) => {
            if (data) {
                results[playerId] = data;
            }
        });

        return results;
    }

    // === HELPER METHODS ===

    /**
     * Update elements with draft data
     */
    async updateElementsWithDraft(draftDataById: Record<number, any>): Promise<void> {
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
            source: 'fpl-with-draft',
            data: updatedElements,
        });
    }

    /**
     * Update individual element summaries with draft data
     */
    // todo: is this needed, tis v slow!!! <- used on 'force regenerate all'
    async updateElementSummariesWithDraft(draftDataById: Record<number, any>): Promise<void> {
        const entries = Object.entries(draftDataById);
        console.log(`📝 Updating ${entries.length} element summaries with draft data`);

        for (const [playerIdStr, draftData] of entries) {
            const playerId = Number.parseInt(playerIdStr);
            console.log(`📝 ....Updating player ${playerId}`);

            // Get existing element summary
            const existingSummary = await this.getElementGameweeks(playerId);
            if (existingSummary) {
                // Add draft data to existing summary
                const updatedSummary = {
                    ...existingSummary,
                    draft: draftData.draft,
                };

                await this.client.setDocument(this.client.collections.FPL_ELEMENTS, `element-${playerIdStr}`, {
                    source: 'fpl-with-draft',
                    data: updatedSummary,
                });
            }
        }

        console.log(`✅ Successfully updated ${entries.length} element summaries with draft data`);
    }

    /**
     * Check if elements have draft data
     */
    async hasDraftData(): Promise<boolean> {
        const elements = await this.getElements();
        return elements ? elements.some((element) => 'draft' in element) : false;
    }

    /**
     * Clear draft data from elements
     */
    async clearDraftData(): Promise<void> {
        const elements = await this.getElements();
        if (!elements) return;

        const clearedElements = elements.map((element) => {
            const { draft, ...elementWithoutDraft } = element;
            return elementWithoutDraft;
        });

        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'elements', {
            source: 'fpl',
            data: clearedElements,
        });
    }

    /**
     * Get players by team (from cached elements)
     */
    async getPlayersByTeam(teamCode: number): Promise<EnhancedPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        return elements
            .filter((player) => player.team_code === teamCode)
            .sort((a, b) => b.draft.pointsTotal - a.draft.pointsTotal);
    }

    /**
     * Get players by position (from cached elements)
     */
    async getPlayersByPosition(position: CustomPosition): Promise<EnhancedPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        return elements
            .filter((player) => player.draft.position === position)
            .sort((a, b) => b.draft.pointsTotal - a.draft.pointsTotal);
    }

    /**
     * Get specific players by IDs (from cached elements)
     */
    async getPlayersByIds(playerIds: number[]): Promise<EnhancedPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        const playerMap = new Map(elements.map((player) => [player.id, player]));
        return playerIds
            .map((id) => playerMap.get(id))
            .filter((player): player is EnhancedPlayerData => player !== undefined)
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Search players by name (from cached elements)
     */
    async searchPlayersByName(searchTerm: string): Promise<EnhancedPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        const normalizedSearch = searchTerm.toLowerCase().trim();

        return elements.filter((player) => {
            const firstName = player.first_name.toLowerCase();
            const secondName = player.second_name.toLowerCase();
            const webName = player.web_name.toLowerCase();

            return (
                firstName.includes(normalizedSearch) ||
                secondName.includes(normalizedSearch) ||
                webName.includes(normalizedSearch)
            );
        });
    }

    // === WRITE METHODS ===

    /**
     * Populate teams document with fresh data
     */
    async populateTeams(teamsData: any[]) {
        console.log('🎉 Populating FPL_BOOTSTRAP teams document with fresh data...');
        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'teams', {
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
            source: 'fpl',
            data: gameweekData,
        });
        return gameweekData;
    }

    /**
     * Populate elements document with fresh data (minimal fields only)
     */
    async populateElements(elementsData: FplPlayerData[]) {
        console.log('🎉 Populating FPL_BOOTSTRAP elements document with fresh data...');
        const filteredElements: FilteredFplPlayerData[] = elementsData.map(convertFplElementToCache);

        await this.client.setDocument(this.client.collections.FPL_BOOTSTRAP, 'elements', {
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
        const elements = await this.populateElements(bootstrapData.elements);
        return { teams, events, elements };
    }

    /**
     * Populate element summary document with fresh data
     */
    async populateElementSummary(playerId: number, summaryData: any): Promise<void> {
        const history: FilteredFplPlayerData[] = summaryData.history.map(convertFplElementHistoryToCache);

        await this.client.setDocument(this.client.collections.FPL_ELEMENTS, `element-${playerId}`, {
            source: 'fpl',
            data: { fixtures: summaryData.fixtures, history },
        });
    }

    /**
     * Populate multiple element summary documents with fresh data
     */
    // todo : batch to reduce cost
    // todo : restrict to id in sheeets
    async populateElementSummaries(summariesData: Record<number, any>): Promise<void> {
        const entries = Object.entries(summariesData);
        console.log(`📝 Writing ${entries.length} element summaries individually to avoid payload limits`);

        for (const [playerIdStr, data] of entries) {
            console.log(`📝 ... ${playerIdStr}`);
            await this.client.setDocument(this.client.collections.FPL_ELEMENTS, `element-${playerIdStr}`, {
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
    async getElementSummariesCount(): Promise<number> {
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
            // todo: clear cache
            console.log('✅ Bootstrap data cleared');
        } catch (error) {
            console.error('❌ Error clearing bootstrap data:', error);
            throw error;
        }
    }

    /**
     * Clear element summaries
     */
    async clearElementSummaries(): Promise<void> {
        try {
            await this.clearService.clearCollection(this.client.collections.FPL_ELEMENTS);
            console.log('✅ Element summaries cleared');
        } catch (error) {
            console.error('❌ Error clearing element summaries:', error);
            throw error;
        }
    }
}
