/* Location: app/admin/server/services/new-players.service.ts */

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type { FplPlayerData } from '../../../_shared/lib/fpl/fpl-types';
import {
    appendPlayerInboxRows,
    type NewPlayerInboxRow,
    PLAYER_INBOX_MISSING,
    type PlayerInboxRow,
    readPlayerInbox,
    updatePlayerInboxRow,
} from '../../../_shared/lib/sheets/player-inbox';
import { readPlayers } from '../../../_shared/lib/sheets/players';
import { appendPlayersRows, readFplExportCodes, readPlayersCodes } from '../../../_shared/lib/sheets/players-write';
import type {
    FplElementType,
    HeldPlayer,
    NewPlayerCandidate,
    PositionBucket,
    PositionSuggestion,
} from '../../types/new-players-types';
import { isPositionBucket } from '../../types/new-players-types';

/**
 * Finding players FPL has that the sheet does not, and getting them into the game.
 *
 * The `Players` tab is a hard gate: `fpl-firestore.ts`, `players.server.ts` and
 * `transfers.server.ts` all reduce FPL's player list to the codes present in it, so a
 * player absent from it is undraftable, untransferable and has no player page. Closing
 * the gap between "FPL added a signing" and "somebody assigned a position" is what this
 * service is for.
 */

const FPL_ELEMENT_TYPES: Record<number, FplElementType> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export interface NewPlayersData {
    newPlayers: NewPlayerCandidate[];
    heldPlayers: HeldPlayer[];
    /** False when the PlayerInbox tab does not exist, so the page can say so. */
    inboxAvailable: boolean;
    /**
     * How many players FPL has that the export tab has not caught up with yet. They are
     * held back rather than listed, because a row appended for a code the export lacks
     * gets `#N/A` in all four formula columns.
     */
    awaitingExport: number;
}

export interface ApprovalRequest {
    code: number;
    position: PositionBucket;
}

export interface ActionResult {
    success: boolean;
    message: string;
}

/**
 * The raw bootstrap, NOT `getFplPlayers()`.
 *
 * `getFplPlayers()` reads Firestore, which `populateBootstrap` fills with players already
 * filtered down to the sheet's codes -- so by construction it can never contain a player
 * the sheet is missing, which is the only kind this service cares about.
 */
async function readFplElements(): Promise<{ elements: FplPlayerData[]; clubByCode: Record<number, string> }> {
    const bootstrap = await fplApiCache.getFplBootstrap();

    const clubByCode: Record<number, string> = {};
    for (const team of bootstrap.teams) clubByCode[team.code] = team.short_name;

    return { elements: bootstrap.elements, clubByCode };
}

function suggestionFrom(row: PlayerInboxRow): PositionSuggestion | null {
    if (!row.suggested && row.reasoning.length === 0) return null;

    return {
        position: isPositionBucket(row.suggested) ? row.suggested : null,
        confidence: (['high', 'medium', 'low'] as const).find((c) => c === row.confidence) ?? 'low',
        basis: row.basis === 'record' ? 'record' : 'projection',
        summary: row.summary,
        reasoning: row.reasoning,
        sources: row.sources,
    };
}

export async function getNewPlayersData(): Promise<NewPlayersData> {
    const [{ elements, clubByCode }, sheetPlayers, exportCodes] = await Promise.all([
        readFplElements(),
        readPlayers(),
        readFplExportCodes(),
    ]);

    const inGame = new Set(sheetPlayers.map((player) => player.code));

    let inbox: PlayerInboxRow[] = [];
    let inboxAvailable = true;
    try {
        inbox = await readPlayerInbox();
    } catch (error) {
        if ((error as { code?: string })?.code !== PLAYER_INBOX_MISSING) throw error;
        inboxAvailable = false;
    }

    const inboxByCode = new Map(inbox.map((row) => [row.code, row]));

    // A player already in Players is done, however the inbox describes them -- the sheet
    // is the truth about who is in the game, not the inbox's own status column.
    const missing = elements.filter((element) => !inGame.has(element.code));

    // Offering someone the export tab has not seen would append a row whose club, value and
    // status are all #N/A, so they wait a day for the export to catch up instead.
    const awaiting = missing.filter((element) => exportCodes.has(element.code));
    const awaitingExport = missing.length - awaiting.length;

    const newPlayers: NewPlayerCandidate[] = awaiting
        .filter((element) => (inboxByCode.get(element.code)?.status ?? '') !== 'approved')
        .map((element) => {
            const row = inboxByCode.get(element.code);

            return {
                code: element.code,
                webName: row?.name || element.web_name,
                club: clubByCode[element.team_code] ?? '',
                fplType: FPL_ELEMENT_TYPES[element.element_type] ?? 'MID',
                suggestion: row ? suggestionFrom(row) : null,
            };
        });

    const heldPlayers: HeldPlayer[] = awaiting
        .filter((element) => inboxByCode.get(element.code)?.status === 'approved')
        .map((element) => {
            const row = inboxByCode.get(element.code) as PlayerInboxRow;

            return {
                code: element.code,
                webName: row.name || element.web_name,
                club: clubByCode[element.team_code] ?? '',
                position: row.position as PositionBucket,
                addedAt: row.added,
            };
        });

    return { newPlayers, heldPlayers, inboxAvailable, awaitingExport };
}

/**
 * Record an agreed position and hold the player.
 *
 * Nothing is written to `Players` here. A row in `Players` IS a player in the game, so
 * writing one would skip the draw entirely -- the batch has to be announced first.
 */
export async function approveNewPlayers(approvals: ApprovalRequest[], now: Date): Promise<ActionResult> {
    if (approvals.length === 0) return { success: false, message: 'Nothing selected.' };

    const invalid = approvals.filter((approval) => !isPositionBucket(approval.position));
    if (invalid.length > 0) {
        return { success: false, message: `Not a position: ${invalid.map((a) => a.position).join(', ')}` };
    }

    const [{ elements, clubByCode }, inGame] = await Promise.all([readFplElements(), readPlayersCodes()]);

    const alreadyIn = approvals.filter((approval) => inGame.has(approval.code));
    if (alreadyIn.length > 0) {
        return {
            success: false,
            message: `Already in the game: ${alreadyIn.map((a) => a.code).join(', ')}. Reload the page.`,
        };
    }

    const inbox = await readPlayerInbox();
    const inboxByCode = new Map(inbox.map((row) => [row.code, row]));
    const elementByCode = new Map(elements.map((element) => [element.code, element]));

    const additions: NewPlayerInboxRow[] = [];

    for (const approval of approvals) {
        const existing = inboxByCode.get(approval.code);

        if (existing) {
            // Rewritten one row at a time: the rows are scattered and a whole-tab write
            // would overwrite anything the suggester appended since this page loaded.
            await updatePlayerInboxRow({ ...existing, position: approval.position, status: 'approved' });
            continue;
        }

        // Approved without ever having been researched, which is the normal case before
        // the suggester exists. The row is created so the hold has somewhere to live.
        const element = elementByCode.get(approval.code);
        if (!element) return { success: false, message: `FPL has no player with code ${approval.code}.` };

        additions.push({
            code: element.code,
            name: element.web_name,
            club: clubByCode[element.team_code] ?? '',
            fplType: FPL_ELEMENT_TYPES[element.element_type] ?? 'MID',
            suggested: '',
            confidence: '',
            basis: '',
            summary: '',
            reasoning: [],
            sources: [],
            added: now.toISOString(),
            position: approval.position,
            status: 'approved',
        });
    }

    await appendPlayerInboxRows(additions, inbox.length);

    return {
        success: true,
        message: `${approvals.length} ${approvals.length === 1 ? 'player' : 'players'} held. Release them to put them into the new-player window.`,
    };
}

/**
 * Put held players into the game: one append to `Players`, with `new` set.
 *
 * This is the only write to `Players` in the whole flow.
 *
 * **The sheet write is not the whole job.** `/players` and the transfer selector read
 * `getFplPlayers()`, which is Firestore, which `populateBootstrap` filled by filtering
 * FPL's list down to the sheet codes *as they were at populate time* -- so a code appended
 * now is not in it. Dropping the sheets cache is necessary and not sufficient.
 *
 * Repopulating is deliberately left to the admin rather than done here: `preloadCommonData`
 * clears the bootstrap before rebuilding it, and a failure partway through that would take
 * the site's player data down as a side effect of adding one player. So the caller is told
 * to press the button that already exists, and the released rows are safe in the sheet
 * either way.
 */
export async function releasePlayers(codes: number[]): Promise<ActionResult> {
    if (codes.length === 0) return { success: false, message: 'Nothing selected.' };

    const inbox = await readPlayerInbox();
    const inboxByCode = new Map(inbox.map((row) => [row.code, row]));

    const rows = codes.map((code) => inboxByCode.get(code));
    const missing = codes.filter((code, index) => !rows[index] || rows[index]?.status !== 'approved');
    if (missing.length > 0) {
        return { success: false, message: `Not held: ${missing.join(', ')}. Reload the page.` };
    }

    const approved = rows as PlayerInboxRow[];

    const blank = approved.filter((row) => !isPositionBucket(row.position));
    if (blank.length > 0) {
        return { success: false, message: `No position set for: ${blank.map((row) => row.name).join(', ')}` };
    }

    const [inGame, exportCodes] = await Promise.all([readPlayersCodes(), readFplExportCodes()]);

    const duplicates = approved.filter((row) => inGame.has(row.code));
    if (duplicates.length > 0) {
        return { success: false, message: `Already in the game: ${duplicates.map((row) => row.name).join(', ')}` };
    }

    // Checked again here, not just when the list was built: the four formula columns look
    // the code up in the export tab, and writing a row without it gives #N/A club, value
    // and status, which is worse than not adding the player at all.
    const notExported = approved.filter((row) => !exportCodes.has(row.code));
    if (notExported.length > 0) {
        return {
            success: false,
            message:
                `Not in FPL_Player_export yet: ${notExported.map((row) => row.name).join(', ')}. ` +
                'Refresh that tab first, or their club, value and status will come through as #N/A.',
        };
    }

    await appendPlayersRows(approved.map((row) => ({ code: row.code, webName: row.name, position: row.position })));

    for (const row of approved) {
        await updatePlayerInboxRow({ ...row, status: 'released' });
    }

    return {
        success: true,
        message:
            `${approved.length} ${approved.length === 1 ? 'player is' : 'players are'} now in the sheet. ` +
            'Run "Populate Bootstrap Data" on GameWeek Processing to make them visible on the site.',
    };
}
