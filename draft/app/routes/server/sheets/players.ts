import { readSheetRange, type SheetRange } from './utils/common';
import type { PlayerData } from '../../../types';

const PLAYERS_SHEET_NAME = 'Players';

export async function readPlayers(): Promise<PlayerData[]> {
    try {
        console.log(`Reading Sheet Players ...`);
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${PLAYERS_SHEET_NAME}'!A:Z`
        };

        const data = await readSheetRange(sheetRange);

        if (!data || data.length < 2) {
            console.warn('No player data found or insufficient data');
            return [];
        }

        const headers = data[0].map((h: string) => h.toLowerCase().trim());
        const rows = data.slice(1);

        // console.log('Players spreadsheet headers:', headers);
        // console.log('Sample row:', rows[0]);

        const gsheetPlayers = rows.map((row: any[], index: number) => {
            try {
                // Helper function to get value by header name
                const getValue = (headerName: string): string => {
                    const headerIndex = headers.findIndex(h =>
                        h.includes(headerName.toLowerCase()) ||
                        headerName.toLowerCase().includes(h)
                    );
                    const value = headerIndex >= 0 ? (row[headerIndex] || '') : '';
                    // console.log(`Looking for '${headerName}' in headers, found at index ${headerIndex}, value: '${value}'`);
                    return value;
                };

                const getNumberValue = (headerName: string): number | undefined => {
                    const value = getValue(headerName);
                    const num = parseInt(value);
                    return isNaN(num) ? undefined : num;
                };

                const player: PlayerData = {
                    id: getValue('id') || getValue('player_id'),
                    code: getValue('code'),
                    firstName: getValue('first') || getValue('firstname') || getValue('first_name'),
                    lastName: getValue('last') || getValue('lastname') || getValue('last_name') || getValue('second_name'),
                    position: getValue('position') || getValue('pos'), // This is crucial
                    team: getValue('team') || getValue('club'),
                    fplId: getNumberValue('fpl') || getNumberValue('fpl_id') || getNumberValue('fplid') || getNumberValue('code'),
                    webName: getValue('web') || getValue('webname') || getValue('web_name'),
                };

                // Only return if we have minimum required data
                if (player.firstName && player.lastName) {
                    return player;
                }

                return null;
            } catch (error) {
                console.error(`Error processing player row ${index}:`, error, row);
                return null;
            }
        }).filter((player): player is PlayerData => player !== null);
        console.log(`...found ${gsheetPlayers.length} gSheet Players ...`);
        return gsheetPlayers
    } catch (error) {
        console.error('Error reading players from spreadsheet:', error);
        throw new Error('Failed to read players data');
    }
}
