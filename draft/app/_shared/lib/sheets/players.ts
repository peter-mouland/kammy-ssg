/* Location: app/_shared/lib/sheets/players.ts */

import type { PlayersSheetData } from '../../types/sheets-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { readSheetRange, type SheetRange } from './utils/common';

const PLAYERS_SHEET_NAME = 'Players';

async function originalReadPlayers(): Promise<PlayersSheetData[]> {
    try {
        console.log('Reading Sheet Players ...');
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYERS_SHEET_NAME}'!A:Z`,
        };

        const data = await readSheetRange(sheetRange);

        if (!data || data.length < 2) {
            console.warn('No player data found or insufficient data');
            return [];
        }

        const headers = data[0].map((h: string) => h.toLowerCase().trim());
        const rows = data.slice(1);

        const gsheetPlayers = rows
            .map((row: any[], index: number) => {
                try {
                    // Helper function to get value by header name
                    const getValue = (headerName: string): string => {
                        const headerIndex = headers.findIndex(
                            (h) => h.includes(headerName.toLowerCase()) || headerName.toLowerCase().includes(h),
                        );
                        const value = headerIndex >= 0 ? row[headerIndex] || '' : '';
                        // console.log(`Looking for '${headerName}' in headers, found at index ${headerIndex}, value: '${value}'`);
                        return value;
                    };

                    const getNumberValue = (headerName: string): number => {
                        const value = getValue(headerName);
                        const num = Number.parseInt(value, 10);
                        return num;
                    };

                    const player: PlayersSheetData = {
                        isHidden: getValue('isHidden'),
                        code: getNumberValue('code'),
                        position: getValue('position') || getValue('pos'), // This is crucial
                        team: getValue('team') || getValue('club'),
                        webName: getValue('web') || getValue('webname') || getValue('web_name'),
                        new: getValue('new') || getValue('isNew') || getValue('is_new'),
                    };

                    // Only return if we have minimum required data
                    if (player.code) {
                        return player;
                    }

                    return null;
                } catch (error) {
                    console.error(`Error processing player row ${index}:`, error, row);
                    return null;
                }
            })
            .filter((player) => player !== null);
        // can't filter 'isHidden here, // && player.isHidden !== 'hidden');
        // if a player is hidden mid-season, we break historical views of the site

        console.log(`...found ${gsheetPlayers.length} gSheet Players ...`);
        return gsheetPlayers;
    } catch (error) {
        console.error('Error reading players from spreadsheet:', error);
        throw new Error('Failed to read players data');
    }
}

export async function readPlayers(): Promise<PlayersSheetData[]> {
    return await dataCache.get(CACHE_KEYS.SHEETS.PLAYERS, originalReadPlayers, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.PLAYERS),
    });
}
