/* Location: app/admin/admin-new-players.route.tsx */

import type { MetaFunction } from 'react-router';
import { NewPlayersSection } from './components/sections/new-players-section';
import { AdminMessage } from './components/ui/admin-message';
import type { HeldPlayer, NewPlayerCandidate } from './types/new-players-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'New Players - Fantasy Football Admin' },
        { name: 'description', content: 'Approve positions for new players and release them into the game' },
    ];
};

/**
 * MOCKUP DATA -- delete when the loader lands.
 *
 * Deliberately covers the cases the page has to get right rather than three tidy rows:
 * a high-confidence call from a real deployment record, a projection for a signing with no
 * Premier League minutes, and a player nothing could be found for at all.
 */
const SAMPLE_NEW_PLAYERS: NewPlayerCandidate[] = [
    {
        code: 118748,
        webName: 'Dubravka',
        club: 'BUR',
        fplType: 'GKP',
        suggestion: {
            position: 'GK',
            confidence: 'high',
            basis: 'record',
            sourceUrl: 'https://www.fotmob.com/players/example',
            note: undefined,
        },
    },
    {
        code: 542273,
        webName: 'Kone',
        club: 'WOL',
        fplType: 'MID',
        suggestion: {
            position: 'MID',
            confidence: 'high',
            basis: 'record',
            sourceUrl: 'https://www.fotmob.com/players/example',
            note: undefined,
        },
    },
    {
        code: 601122,
        webName: 'Ferreira',
        club: 'NEW',
        fplType: 'FWD',
        suggestion: {
            position: 'CA',
            confidence: 'low',
            basis: 'projection',
            sourceUrl: 'https://www.sofascore.com/player/example',
            note: 'No Premier League minutes yet; 28 starts at centre forward in 2025.',
        },
    },
    {
        code: 611903,
        webName: 'Adeyemi',
        club: 'BHA',
        fplType: 'DEF',
        suggestion: {
            position: null,
            confidence: 'low',
            basis: 'projection',
            sourceUrl: null,
            note: 'No usable source found. Needs a manual call.',
        },
    },
];

const SAMPLE_HELD_PLAYERS: HeldPlayer[] = [
    { code: 245671, webName: 'Silva', club: 'AVL', position: 'WA', addedAt: '2026-08-19T09:00:00.000Z' },
    { code: 388120, webName: 'Bergstrom', club: 'FUL', position: 'CB', addedAt: '2026-08-22T09:00:00.000Z' },
];

export default function AdminNewPlayersRoute() {
    return (
        <>
            <AdminMessage type="info">
                This page is a mockup. The data below is hardcoded and the buttons do nothing yet.
            </AdminMessage>
            <NewPlayersSection newPlayers={SAMPLE_NEW_PLAYERS} heldPlayers={SAMPLE_HELD_PLAYERS} />
        </>
    );
}
