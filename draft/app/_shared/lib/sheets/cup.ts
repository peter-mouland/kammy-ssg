/* Location: app/_shared/lib/sheets/cup.ts */

import { parseCupConfig, serializeCupConfig } from '../../../cup/lib/cup-config';
import type {
    CupConfig,
    CupMatchup,
    CupSheetData,
    CupStageId,
    ProcessedCupSheetData,
} from '../../../cup/types/cup-types';
import type { DivisionId, ManagerId } from '../../../teams/types/team-types';
import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { convertToRowsWithHeaders, getCachedHeaders, setCachedHeaders } from './cache/utils';
import { appendToSheet, createAppError, readSheetRange, type SheetRange, writeSheetRange } from './utils/common';
import { readDataFromSheet } from './utils/read-data-from-sheets';

// The cup is cross-division, so submissions live in a single tab (not per-division).
const CUP_SHEET_NAME = 'Cup';
const CUP_CONFIG_SHEET_NAME = 'CupConfig';
const CUP_BRACKET_SHEET_NAME = 'CupBracket';

const CUP_HEADERS: Record<keyof CupSheetData, keyof ProcessedCupSheetData> = {
    Status: 'status',
    Timestamp: 'timestamp',
    Manager: 'manager',
    Division: 'division',
    Gameweek: 'gameweek',
    Stage: 'stage',
    Leg: 'leg',
    Players: 'players',
    SubmittedByAdmin: 'submittedByAdmin',
    AdminReason: 'adminReason',
};

const CUP_SHEET_HEADERS = [
    'Status',
    'Timestamp',
    'Manager',
    'Division',
    'Gameweek',
    'Stage',
    'Leg',
    'Players',
    'SubmittedByAdmin',
    'AdminReason',
] as const;

const CUP_TRANSFORM_FUNCTIONS = {
    Status: (value: any): string => {
        if (!value || value === '') return '';
        return String(value).trim().toUpperCase();
    },
    Timestamp: (value: any): Date => {
        if (!value) throw new Error('Timestamp is required');
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid timestamp format: ${value}`);
            return parsed;
        }
        if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        }
        throw new Error(`Unable to parse timestamp: ${value}`);
    },
    Manager: (value: any): string => {
        if (!value) throw new Error('Manager is required');
        return String(value).trim();
    },
    Division: (value: any): string => (value ? String(value).trim() : ''),
    Gameweek: (value: any): number => {
        const parsed = Number.parseInt(String(value), 10);
        if (Number.isNaN(parsed)) throw new Error(`Invalid Gameweek: ${value}`);
        return parsed;
    },
    Stage: (value: any): string => {
        if (!value) throw new Error('Stage is required');
        return String(value).trim().toLowerCase();
    },
    Leg: (value: any): number => {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) ? 1 : parsed;
    },
    Players: (value: any): number[] => {
        if (!value) return [];
        return String(value)
            .split(',')
            .map((code) => Number.parseInt(code.trim(), 10))
            .filter((code) => !Number.isNaN(code));
    },
    SubmittedByAdmin: (value: any): boolean => {
        if (typeof value === 'boolean') return value;
        const normalized = String(value).trim().toLowerCase();
        return normalized === 'true' || normalized === 'yes' || normalized === 'y' || normalized === '1';
    },
    AdminReason: (value: any): string => (value ? String(value).trim() : ''),
};

async function originalReadCupSubmissions(): Promise<ProcessedCupSheetData[]> {
    try {
        const sheetResult = await readDataFromSheet<Record<string, any>>(CUP_SHEET_NAME, {
            headerOrder: [...CUP_SHEET_HEADERS],
            transformFunctions: CUP_TRANSFORM_FUNCTIONS,
            requireAllHeaders: true,
            warnMissingHeaders: true,
        });

        return sheetResult.map((row) => ({
            status: row.Status,
            timestamp: row.Timestamp,
            manager: row.Manager,
            division: row.Division as DivisionId,
            gameweek: row.Gameweek,
            stage: row.Stage as CupStageId,
            leg: row.Leg,
            players: row.Players,
            submittedByAdmin: row.SubmittedByAdmin,
            adminReason: row.AdminReason,
        }));
    } catch (error) {
        throw createAppError('CUP_READ_ERROR', 'Failed to read cup submissions from sheet', error);
    }
}

export async function readCupSubmissions(): Promise<ProcessedCupSheetData[]> {
    return await dataCache.get(CACHE_KEYS.SHEETS.CUP, () => originalReadCupSubmissions(), {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.CUP),
    });
}

export async function addCupSubmission(submission: ProcessedCupSheetData): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const cacheKey = `${spreadsheetId}:${CUP_SHEET_NAME}`;

        let headers = getCachedHeaders(cacheKey);
        if (!headers) {
            const headerRange: SheetRange = { spreadsheetId, range: `'${CUP_SHEET_NAME}'!1:1` };
            const headerData = await readSheetRange(headerRange);
            headers = headerData.length > 0 ? headerData[0] : [];
            setCachedHeaders(cacheKey, headers);
        }

        if (headers.length === 0) {
            throw new Error('No headers found in cup sheet');
        }

        // Serialise the player-code array back to a comma-separated cell value.
        const row = { ...submission, players: submission.players.join(',') };
        const rows = convertToRowsWithHeaders([row], headers, CUP_HEADERS);

        const sheetRange: SheetRange = {
            spreadsheetId,
            range: `'${CUP_SHEET_NAME}'!A:${String.fromCharCode(64 + headers.length)}`,
        };

        await appendToSheet(sheetRange, rows);
        dataCache.invalidate(CACHE_KEYS.SHEETS.CUP);
    } catch (error) {
        throw createAppError('CUP_ADD_ERROR', 'Failed to add cup submission to sheet', error);
    }
}

/**
 * The stage->gameweek config is stored as key/value rows in the CupConfig tab.
 * Parsing/serialising lives in cup-config.ts (pure, unit-tested); this layer
 * only handles the sheet I/O and caching.
 */
async function originalReadCupConfig(): Promise<CupConfig> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const range: SheetRange = { spreadsheetId, range: `'${CUP_CONFIG_SHEET_NAME}'!A:B` };
        const rows = await readSheetRange(range);

        // Skip the header row; map [key, value] pairs.
        const configRows = rows
            .slice(1)
            .filter((row) => row.length >= 2)
            .map((row) => ({ key: String(row[0]), value: String(row[1]) }));

        return parseCupConfig(configRows);
    } catch (error) {
        throw createAppError('CUP_CONFIG_READ_ERROR', 'Failed to read cup config from sheet', error);
    }
}

export async function readCupConfig(): Promise<CupConfig> {
    return await dataCache.get(CACHE_KEYS.SHEETS.CUP_CONFIG, () => originalReadCupConfig(), {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.CUP_CONFIG),
    });
}

export async function writeCupConfig(config: CupConfig): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const rows = [['Key', 'Value'], ...serializeCupConfig(config).map((r) => [r.key, r.value])];
        // Overwrite (not append) so the config is a single authoritative block.
        const range: SheetRange = { spreadsheetId, range: `'${CUP_CONFIG_SHEET_NAME}'!A:B` };
        await writeSheetRange(range, rows);
        dataCache.invalidate(CACHE_KEYS.SHEETS.CUP_CONFIG);
        dataCache.invalidate(CACHE_KEYS.SHEETS.CUP);
    } catch (error) {
        throw createAppError('CUP_CONFIG_WRITE_ERROR', 'Failed to write cup config to sheet', error);
    }
}

const CUP_BRACKET_HEADERS = ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'] as const;

function toManagerId(value: unknown): ManagerId | null {
    const str = value === undefined || value === null ? '' : String(value).trim();
    return str === '' ? null : str;
}

function toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

async function originalReadCupBracket(): Promise<CupMatchup[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const range: SheetRange = { spreadsheetId, range: `'${CUP_BRACKET_SHEET_NAME}'!A:G` };
        const rows = await readSheetRange(range);

        return rows
            .slice(1)
            .filter((row) => row.length > 0 && String(row[0]).trim() !== '')
            .map((row) => ({
                stage: String(row[0]).trim() as CupStageId,
                tie: Number(row[1]) || 0,
                home: toManagerId(row[2]),
                away: toManagerId(row[3]),
                homeAggregate: toOptionalNumber(row[4]),
                awayAggregate: toOptionalNumber(row[5]),
                winner: toManagerId(row[6]) ?? undefined,
            }));
    } catch (error) {
        throw createAppError('CUP_BRACKET_READ_ERROR', 'Failed to read cup bracket from sheet', error);
    }
}

export async function readCupBracket(): Promise<CupMatchup[]> {
    return await dataCache.get(CACHE_KEYS.SHEETS.CUP_BRACKET, () => originalReadCupBracket(), {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.CUP_BRACKET),
    });
}

export async function writeCupBracket(matchups: CupMatchup[]): Promise<void> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const rows = [
            [...CUP_BRACKET_HEADERS],
            ...matchups.map((m) => [
                m.stage,
                m.tie,
                m.home ?? '',
                m.away ?? '',
                m.homeAggregate ?? '',
                m.awayAggregate ?? '',
                m.winner ?? '',
            ]),
        ];
        const range: SheetRange = { spreadsheetId, range: `'${CUP_BRACKET_SHEET_NAME}'!A:G` };
        await writeSheetRange(range, rows);
        dataCache.invalidate(CACHE_KEYS.SHEETS.CUP_BRACKET);
    } catch (error) {
        throw createAppError('CUP_BRACKET_WRITE_ERROR', 'Failed to write cup bracket to sheet', error);
    }
}
