/* Location: app/scoring/server/services/division-teams.service.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { resetInMemoryFirestore } from '../../../_shared/lib/firestore-cache/firestore-memory';
import type { TeamRoster } from '../../../_shared/types/squad-types';
import type { DivisionTeamsDocument, RosterByManagerId } from '../../../teams';
import {
    createDivisionTeamsDocument,
    divisionDocumentExists,
    getDivisionTeamsDocument,
    getTeamsForGameweek,
    updateDivisionTeamsDocument,
} from '../../index.server';

/**
 * `division-teams` is the collection the whole season rebuild writes into -- one document
 * per division per gameweek, 117 of them -- so these five exports are the harness's floor.
 * Nothing above them can be trusted until a document written at GW21 comes back at GW21,
 * for the right division, with the roster intact.
 *
 * It runs against the in-memory fixture Firestore rather than a real one. That is a real
 * boundary substitution, not a module mock: every line of the service below runs, and the
 * gap it leaves (Firestore's own serialisation) is named in `firestore-memory.ts`.
 *
 * The flag is read lazily by `getFirestoreInstance()`, so setting it after the imports is
 * fine: nothing calls the getter at module scope.
 */
process.env.KAMMY_FIXTURE_FIRESTORE = '1';

/**
 * One slot is enough. What is under test is the document round-trip, not the roster
 * shape, and a full 13-slot squad here would only hide which field the assertions read.
 */
const roster = (playerCode: number) =>
    ({
        gk_0: { player: { playerCode, playerName: 'A Keeper' } },
    }) as unknown as TeamRoster;

const divisionTeams = (
    divisionId: DivisionTeamsDocument['divisionId'],
    gameweek: number,
    playerCode = 1,
): DivisionTeamsDocument => ({
    divisionId,
    gameweek,
    lastUpdated: '2025-01-20T00:00:00.000Z',
    teams: { ann: { roster: roster(playerCode) } } as unknown as RosterByManagerId,
    metadata: {
        createdAt: '2025-01-20T00:00:00.000Z',
        updatedAt: '2025-01-20T00:00:00.000Z',
        pointsLastUpdated: null,
        pointsLastGameweek: null,
    },
});

afterEach(() => {
    resetInMemoryFirestore();
});

describe('creating and reading a division teams document', () => {
    it('reads back what was written', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21));

        const doc = await getDivisionTeamsDocument('leagueOne', 21);

        expect(doc?.divisionId).toBe('leagueOne');
        expect(doc?.gameweek).toBe(21);
        expect(Object.keys(doc?.teams ?? {})).toEqual(['ann']);
    });

    it('reports the document as existing only once it has been created', async () => {
        expect(await divisionDocumentExists('leagueOne', 21)).toBe(false);

        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21));

        expect(await divisionDocumentExists('leagueOne', 21)).toBe(true);
    });

    it('returns null rather than throwing for a gameweek that has not been generated', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21));

        expect(await getDivisionTeamsDocument('leagueOne', 22)).toBeNull();
    });

    it('keeps each division in its own document at the same gameweek', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21, 111));
        await createDivisionTeamsDocument(divisionTeams('championship', 21, 222));

        const leagueOne = await getDivisionTeamsDocument('leagueOne', 21);
        const championship = await getDivisionTeamsDocument('championship', 21);

        expect(leagueOne?.teams.ann.roster.gk_0.player.playerCode).toBe(111);
        expect(championship?.teams.ann.roster.gk_0.player.playerCode).toBe(222);
    });

    it('keeps each gameweek in its own document, so the season is a history not a snapshot', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21, 111));
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 22, 222));

        expect((await getDivisionTeamsDocument('leagueOne', 21))?.teams.ann.roster.gk_0.player.playerCode).toBe(111);
        expect((await getDivisionTeamsDocument('leagueOne', 22))?.teams.ann.roster.gk_0.player.playerCode).toBe(222);
    });
});

describe('reading one manager’s team for a gameweek', () => {
    it('returns that manager’s roster and the document it came from', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21, 111));

        const team = await getTeamsForGameweek('leagueOne', 'ann', 21);

        expect(team?.gameweek).toBe(21);
        expect(team?.roster.gk_0.player.playerCode).toBe(111);
        expect(team?.lastUpdated).toBe('2025-01-20T00:00:00.000Z');
    });

    it('returns null for a manager who is not in the division', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21));

        expect(await getTeamsForGameweek('leagueOne', 'not-a-manager', 21)).toBeNull();
    });

    it('returns null when the gameweek has no document at all', async () => {
        expect(await getTeamsForGameweek('leagueOne', 'ann', 21)).toBeNull();
    });
});

describe('updating a division teams document', () => {
    it('merges the update into the existing document', async () => {
        await createDivisionTeamsDocument(divisionTeams('leagueOne', 21, 111));

        await updateDivisionTeamsDocument('leagueOne', 21, {
            teams: { ann: { roster: roster(999) } } as unknown as RosterByManagerId,
        });

        const doc = await getDivisionTeamsDocument('leagueOne', 21);
        expect(doc?.teams.ann.roster.gk_0.player.playerCode).toBe(999);
        expect(doc?.gameweek).toBe(21); // untouched by the update
    });

    it('fails loudly when the document has not been created yet', async () => {
        await expect(updateDivisionTeamsDocument('leagueOne', 21, { gameweek: 21 })).rejects.toThrow(
            /Failed to update division teams document/,
        );
    });
});
