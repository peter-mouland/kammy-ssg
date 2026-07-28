/* Location: app/cup/server/cup-sheets.ts */

import {
    addCupSubmissionRow,
    readCupBracketRows,
    readCupConfigRows,
    readCupSubmissionRows,
    writeCupBracketRows,
    writeCupConfigRows,
} from '../../_shared/lib/sheets/cup';
import { parseCupConfig, serializeCupConfig } from '../lib/cup-config';
import type { CupConfig, CupMatchup, CupStageId, ProcessedCupSheetData } from '../types/cup-types';

/**
 * The cup domain's view of its own sheets.
 *
 * `_shared/lib/sheets/cup.ts` handles the sheet I/O and caching and returns raw rows;
 * every cup-shaped decision — parsing the config, narrowing a stage string to a
 * `CupStageId`, turning bracket rows into `CupMatchup`s — happens here.
 *
 * It used to happen in the reader, which is why `_shared` imported `cup/lib/cup-config`
 * and `cup/types`. See P2.3 in `.kiro/backlog.md`.
 */

export async function readCupSubmissions(): Promise<ProcessedCupSheetData[]> {
    const rows = await readCupSubmissionRows();

    // The only difference from the row shape: `stage` is a plain string until we say
    // which stage ids are legal.
    return rows.map((row) => ({ ...row, stage: row.stage as CupStageId }));
}

export async function addCupSubmission(submission: ProcessedCupSheetData): Promise<void> {
    await addCupSubmissionRow(submission);
}

export async function readCupConfig(): Promise<CupConfig> {
    return parseCupConfig(await readCupConfigRows());
}

export async function writeCupConfig(config: CupConfig): Promise<void> {
    await writeCupConfigRows(serializeCupConfig(config));
}

export async function readCupBracket(): Promise<CupMatchup[]> {
    const rows = await readCupBracketRows();

    return rows.map((row) => ({ ...row, stage: row.stage as CupStageId }));
}

export async function writeCupBracket(matchups: CupMatchup[]): Promise<void> {
    await writeCupBracketRows(matchups);
}
