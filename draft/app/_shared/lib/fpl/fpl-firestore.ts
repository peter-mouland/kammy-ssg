/* Location: app/_shared/lib/firestore-cache/fpl-cache.ts */
/* Responsibility: */
/* - store fantasy.premierleague.com data into firestore */
/* - give access to fantasy.premierleague.com data from firestore */
/* Notes: */
/* - 90% of use-case should use api-cache*/

import type { EnhancedPlayerData } from '../../types/player-types';
import type { PlayersSheetData } from '../../types/sheets-types';
import { FirestoreClearService } from '../firestore-cache/clear-service';
import { FirestoreClient } from '../firestore-cache/firestore-client';
import { readPlayers } from '../sheets/players';
import { fplApi } from './api';
import type { EventData, FilteredFplPlayerData, FplPlayerData, FplTeam, GameWeekData } from './fpl-types';
import { getGameweekData } from './gameweeks';

const convertFplElementToCache = (element: FplPlayerData) => ({
    id: element.id,
    code: element.code,
    first_name: element.first_name,
    second_name: element.second_name,
    web_name: element.web_name,
    team_code: element.team_code,
    form: element.form,
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

        if (!doc) return [];

        return doc.data.map((gw) => ({
            ...gw,
            start:
                typeof (gw.start as { toDate?: () => Date })?.toDate === 'function'
                    ? (gw.start as { toDate: () => Date }).toDate()
                    : new Date(gw.start as unknown as string | number | Date),
            end:
                typeof (gw.end as { toDate?: () => Date })?.toDate === 'function'
                    ? (gw.end as { toDate: () => Date }).toDate()
                    : new Date(gw.end as unknown as string | number | Date),
        }));
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
     * Preload common data based on what's missing
     */
    async preloadCommonData() {
        console.log('🔄 preloadCommonData()');

        const results: any = {};

        try {
            // ensure db is clean
            await this.clearBootstrapData();

            // populate base db info
            results.bootstrap = await this.populateBootstrap();

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
    async populateElements(elementsData: FplPlayerData[]) {
        console.log('🎉 Populating FPL_BOOTSTRAP elements document with fresh data...');
        const filteredElements: FilteredFplPlayerData[] = elementsData.map((e) => convertFplElementToCache(e));

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
        const sheetPlayers = await readPlayers();
        const sheetsPlayersByCode = sheetPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
            acc[player.code] = player;
            return acc;
        }, {});

        // console.log("sheetsPlayersByCode['485711']");
        // console.log(sheetsPlayersByCode['485711']);
        const availablePlayers = bootstrapData.elements.filter((player) => sheetsPlayersByCode[player.code]);
        const _p = availablePlayers.find((p) => p.code === 485711);
        // console.log('pppppppppppppppppp');
        // console.log(_p);

        const teams = await this.populateTeams(bootstrapData.teams);
        const events = await this.populateEvents(bootstrapData.events);
        const elements = await this.populateElements(availablePlayers);
        return { teams, events, elements };
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
}
