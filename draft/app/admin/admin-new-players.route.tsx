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
            summary: 'Goalkeeper. Nothing to argue about.',
            reasoning: [
                'Started in goal in all 6 sampled Premier League matches, slot 1 in every lineup.',
                'FPL and the real-world role agree, and GK has no neighbouring bucket to be confused with.',
            ],
            sources: [
                { label: 'Sofascore lineups', url: 'https://www.sofascore.com/player/example' },
                { label: 'FotMob profile', url: 'https://www.fotmob.com/players/example' },
            ],
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
            summary: 'Deep midfield in 5 of 5 sampled starts.',
            reasoning: [
                'Slots 6 and 8 in a 4-3-3 across 5 sampled starts, spread through the season to catch a mid-season role change.',
                'Slot order validated against the recognised left back sitting in slot 5 in the same XI.',
                'FotMob benchmarks him against central midfielders, which is independent agreement.',
                'Never started wide, so WA is not in contention.',
            ],
            sources: [
                { label: 'Sofascore lineups', url: 'https://www.sofascore.com/player/example' },
                { label: 'FotMob percentiles', url: 'https://www.fotmob.com/players/example' },
            ],
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
            summary: 'No Premier League minutes yet. Projection, not record.',
            reasoning: [
                'Signed this window, so there is no Premier League deployment to sample. Everything below is projection.',
                '28 of 31 league starts at centre forward for Palmeiras in 2025.',
                'Squad depth puts him behind Isak, so his minutes may come wide rather than central.',
                'CA covers no.10 through no.9, so a centre forward belongs here rather than in a separate striker bucket.',
                'Worth noting: CA and WA score identically, so if this is wrong it costs no points, only a squad slot.',
            ],
            sources: [{ label: 'Sofascore profile', url: 'https://www.sofascore.com/player/example' }],
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
            summary: 'No usable source found. Needs a manual call.',
            reasoning: [
                'No reachable source carries a per-match position for this player.',
                'FPL lists him as DEF, which does not separate CB from FB, so it cannot decide this on its own.',
                'Left blank deliberately rather than guessing between CB and FB.',
            ],
            sources: [],
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
