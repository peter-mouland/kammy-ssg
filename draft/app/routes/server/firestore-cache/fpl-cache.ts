// src/lib/firestore-cache/fpl-cache.ts
import type { FirestoreClient } from './firestore-client'
import type { FplBootstrapData, FplPlayerData } from '../../../types'
import { convertFplElementHistoryToCache, convertFplElementToCache } from '../fpl/stats';
import { processBatchedReads } from '../utils/batch-processor';

// Filtered FPL Player Data Type (absolute essentials only)
export interface FilteredFplPlayerData {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    // Remove all season stats - these should come from element summary instead
}

export class FplCache {
    constructor(
        private client: FirestoreClient,
    ) {}

    // === READ METHODS ===

    /**
     * Get teams from cache
     */
    async getTeams(): Promise<any[] | null> {
        const doc = await this.client.getDocument(
            this.client.collections.FPL_BOOTSTRAP,
            'teams'
        );

        return doc ? doc.data : null;
    }

    /**
     * Get events from cache
     */
    async getEvents(): Promise<any[] | null> {
        const doc = await this.client.getDocument(
            this.client.collections.FPL_BOOTSTRAP,
            'events'
        );

        return doc ? doc.data : null;
    }

    /**
     * Get elements from cache
     */
    async getElements(): Promise<FilteredFplPlayerData[] | null> {
        try {
            console.log('🔄 getElements() - Reading from Firestore...');
            const doc = await this.client.getDocument<FilteredFplPlayerData[]>(
                this.client.collections.FPL_BOOTSTRAP,
                'elements'
            );

            if (doc) {
                console.log(`✅ getElements() - Found ${doc.data.length} elements`);
                return doc.data;
            } else {
                console.log('ℹ️ getElements() - No cached elements found');
                return null;
            }
        } catch (error) {
            console.error('❌ getElements() - Error reading from cache:', error);
            throw error;
        }
    }

    /**
     * Get current gameweek from cached events
     */
    async getCurrentGameweek(): Promise<number | null> {
        const events = await this.getEvents();
        if (!events) return null;

        const currentEvent = events.find((event: any) => event.is_current);
        return currentEvent?.id || null;
    }

    /**
     * Get element summary data (individual player gameweek breakdown)
     */
    async getElementGameweek(playerId: number): Promise<any | null> {
        const doc = await this.client.getDocument(
            this.client.collections.FPL_ELEMENTS,
            `element-${playerId}`
        );

        return doc ? doc.data : null;
    }

    /**
     * Batch get element summaries
     */

    async batchGetElementSummaries(playerIds: number[]): Promise<Record<number, any>> {
        const batchReader = async (playerIdBatch: number[]) => {
            const docIds = playerIdBatch.map(id => `element-${id}`);
            const docs = await this.client.batchGetDocuments(
                this.client.collections.FPL_ELEMENTS,
                docIds
            );

            // Return tuples of [playerId, docData] for easier processing
            return playerIdBatch.map((playerId, index) => ({
                playerId,
                data: docs[index]?.data || null
            }));
        };

        const batchResults = await processBatchedReads(playerIds, batchReader, {
            batchSize: 250, // Adjust based on document sizes
            logProgress: true
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
        const updatedElements = elements.map(element => {
            const draftData = draftDataById[element.id];
            if (draftData) {
                return {
                    ...element,
                    draft: draftData
                };
            }
            return element;
        });

        await this.client.setDocument(
          this.client.collections.FPL_BOOTSTRAP,
          'elements',
          { source: 'fpl-with-draft', data: updatedElements, timestamp: Date.now() }
        );
    }

    /**
     * Update individual element summaries with draft data
     */
    async updateElementSummariesWithDraft(draftDataById: Record<number, any>): Promise<void> {
        const entries = Object.entries(draftDataById);
        console.log(`📝 Updating ${entries.length} element summaries with draft data`);

        for (const [playerIdStr, draftData] of entries) {
            const playerId = parseInt(playerIdStr);

            // Get existing element summary
            const existingSummary = await this.getElementGameweek(playerId);
            if (existingSummary) {
                // Add draft data to existing summary
                const updatedSummary = {
                    ...existingSummary,
                    draft: draftData
                };

                await this.client.setDocument(
                  this.client.collections.FPL_ELEMENTS,
                  `element-${playerIdStr}`,
                  { source: 'fpl-with-draft', data: updatedSummary, timestamp: Date.now() }
                );
            }
        }

        console.log(`✅ Successfully updated ${entries.length} element summaries with draft data`);
    }

    /**
     * Check if elements have draft data
     */
    async hasDraftData(): Promise<boolean> {
        const elements = await this.getElements();
        return elements ? elements.some(element => element.draft) : false;
    }

    /**
     * Clear draft data from elements
     */
    async clearDraftData(): Promise<void> {
        const elements = await this.getElements();
        if (!elements) return;

        const clearedElements = elements.map(element => {
            const { draft, ...elementWithoutDraft } = element;
            return elementWithoutDraft;
        });

        await this.client.setDocument(
          this.client.collections.FPL_BOOTSTRAP,
          'elements',
          { source: 'fpl', data: clearedElements }
        );
    }


    /**
     * Get players by team (from cached elements)
     */
    async getPlayersByTeam(teamId: number): Promise<FplPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        return elements
            .filter(player => player.team === teamId)
            .sort((a, b) => b.total_points - a.total_points);
    }

    /**
     * Get players by position (from cached elements)
     */
    async getPlayersByPosition(elementType: number): Promise<FplPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        return elements
            .filter(player => player.element_type === elementType)
            .sort((a, b) => b.total_points - a.total_points);
    }

    /**
     * Get specific players by IDs (from cached elements)
     */
    async getPlayersByIds(playerIds: number[]): Promise<FplPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        const playerMap = new Map(elements.map(player => [player.id, player]));
        return playerIds
            .map(id => playerMap.get(id))
            .filter((player): player is FplPlayerData => player !== undefined)
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Search players by name (from cached elements)
     */
    async searchPlayersByName(searchTerm: string): Promise<FplPlayerData[]> {
        const elements = await this.getElements();
        if (!elements) return [];

        const normalizedSearch = searchTerm.toLowerCase().trim();

        return elements.filter(player => {
            const firstName = player.first_name.toLowerCase();
            const secondName = player.second_name.toLowerCase();
            const webName = player.web_name.toLowerCase();

            return firstName.includes(normalizedSearch) ||
                secondName.includes(normalizedSearch) ||
                webName.includes(normalizedSearch);
        });
    }

    // === WRITE METHODS ===

    /**
     * Populate teams document with fresh data
     */
    async populateTeams(teamsData: any[]): Promise<void> {
        await this.client.setDocument(
            this.client.collections.FPL_BOOTSTRAP,
            'teams',
            { source: 'fpl', data: teamsData }
        );
    }

    /**
     * Populate events document with fresh data
     */
    async populateEvents(eventsData: any[]): Promise<void> {
        await this.client.setDocument(
            this.client.collections.FPL_BOOTSTRAP,
            'events',
            { source: 'fpl', data: eventsData }
        );
    }

    /**
     * Populate elements document with fresh data (minimal fields only)
     */
    async populateElements(elementsData: FplPlayerData[]): Promise<void> {
        // Filter to only absolute essentials - just identity and team info
        const filteredElements: FilteredFplPlayerData[] = elementsData.map(convertFplElementToCache);

        await this.client.setDocument(
            this.client.collections.FPL_BOOTSTRAP,
            'elements',
            { source: 'fpl', data: filteredElements }
        );
    }

    /**
     * Populate all bootstrap documents with fresh data (chunked for large payloads)
     */
    async populateBootstrap(bootstrapData: FplBootstrapData): Promise<void> {
        await this.populateTeams(bootstrapData.teams)
        await this.populateEvents(bootstrapData.events)
        await this.populateElements(bootstrapData.elements)
    }

    /**
     * Populate element summary document with fresh data
     */
    async populateElementSummary(playerId: number, summaryData: any): Promise<void> {
        const history: FilteredFplPlayerData[] = summaryData.history.map(convertFplElementHistoryToCache);

        await this.client.setDocument(
            this.client.collections.FPL_ELEMENTS,
            `element-${playerId}`,
            { source: 'fpl', data: { fixtures: summaryData.fixtures, history } }
        );
    }

    /**
     * Populate multiple element summary documents with fresh data
     */
    async populateElementSummaries(summariesData: Record<number, any>): Promise<void> {
        const entries = Object.entries(summariesData);
        console.log(`📝 Writing ${entries.length} element summaries individually to avoid payload limits`);

        for (const [playerIdStr, data] of entries) {
            // console.log(` ...element-${playerIdStr}`);
            await this.client.setDocument(
                this.client.collections.FPL_ELEMENTS,
                `element-${playerIdStr}`,
                { source: 'fpl' as const, data }
            );
        }

        console.log(`✅ Successfully wrote ${entries.length} element summaries`);
    }

    // Add this temporary method to your FplCache class
    async debugElementsSize(): Promise<void> {
        try {
            console.log('🔍 Checking elements document...');
            const doc = await this.client.getDocument(
                this.client.collections.FPL_BOOTSTRAP,
                'elements'
            );

            if (doc) {
                const jsonString = JSON.stringify(doc.data);
                const sizeInBytes = new Blob([jsonString]).size;
                console.log(`📊 Elements document size: ${sizeInBytes} bytes (${(sizeInBytes / 1024 / 1024).toFixed(2)} MB)`);
                console.log(`📊 Elements count: ${doc.data.length}`);
            } else {
                console.log('ℹ️ No elements document found');
            }
        } catch (error) {
            console.error('❌ Error checking elements size:', error);
        }
    }
}
