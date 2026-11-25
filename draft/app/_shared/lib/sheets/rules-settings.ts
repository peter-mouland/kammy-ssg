/* Location: app/_shared/lib/sheets/rules-settings.ts */

import { CACHE_KEYS, getCacheTTL } from '../cache/cache-config';
import { dataCache } from '../cache/data-cache.service';
import { createAppError, readSheetRange, type SheetRange } from './utils/common';

/**
 * Key/value config for the /rules page, kept in the league spreadsheet so an admin can
 * change it without a deploy. Same shape as the CupConfig tab: a `key | value` header row,
 * then one setting per row.
 *
 * It lives in the sheet rather than deploy env because the published doc's ID used to be
 * an env var, and a deploy that did not carry `functions/.env` silently dropped it.
 */
export const RULES_SETTINGS_SHEET_NAME = 'Rules Settings';

export type RulesSettings = Record<string, string>;

/** Header row skipped; blank keys ignored; keys and values trimmed. */
function parseRulesSettings(rows: unknown[][]): RulesSettings {
    const settings: RulesSettings = {};

    for (const row of rows.slice(1)) {
        const key = String(row[0] ?? '').trim();
        if (!key) continue;
        settings[key] = String(row[1] ?? '').trim();
    }

    return settings;
}

async function originalReadRulesSettings(): Promise<RulesSettings> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
        const range: SheetRange = { spreadsheetId, range: `'${RULES_SETTINGS_SHEET_NAME}'!A:B` };
        return parseRulesSettings(await readSheetRange(range));
    } catch (error) {
        throw createAppError('RULES_SETTINGS_READ_ERROR', 'Failed to read rules settings from sheet', error);
    }
}

export async function readRulesSettings(): Promise<RulesSettings> {
    return await dataCache.get(CACHE_KEYS.SHEETS.RULES_SETTINGS, originalReadRulesSettings, {
        ttlMs: getCacheTTL(CACHE_KEYS.SHEETS.RULES_SETTINGS),
    });
}
