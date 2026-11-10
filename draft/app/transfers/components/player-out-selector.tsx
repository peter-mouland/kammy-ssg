/* Location: app/transfers/components/player-out-selector.tsx */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Table } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamRoster } from '../../_shared/types/squad-types';
import type { CategoryStanding } from '../../leagues';
import { groupRosterByCategory } from '../lib/group-roster-by-category';
import type { AvailabilityByCode } from '../lib/player-availability';
import { buildPositionRanksByCode } from '../lib/position-rank';
import type { UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import type { TransferType } from '../types/transfer-types';
import { CategoryStandingHeader } from './category-standing-header';
import styles from './player-out-selector.module.css';
import { getTransferOutColumns } from './transfer-out-columns';

interface PlayerOutSelectorProps {
    roster: TeamRoster;
    selectedPlayer: RosterPlayer | null;
    onPlayerChange: (player: RosterPlayer | null) => void;
    transferType: TransferType;
    playersByCode: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<number, FplTeam>;
    /** The manager's standing in each scoring category. Groups render without one when []. */
    categoryStandings?: CategoryStanding[];
    /** Each club's next few gameweeks, by team code. Players show "–" when theirs is missing. */
    upcomingFixturesByTeamCode?: UpcomingFixturesByTeamCode;
    /** Players FPL has doubts about, by code. Those without an entry show no icon. */
    availabilityByCode?: AvailabilityByCode;
    /** Every player a manager could sign: what each squad player's position rank is measured against. */
    availablePlayers?: EnhancedPlayerData[];
    embeddedInJourney?: boolean;
}

const EMPTY_STATE = {
    icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
        </svg>
    ),
    title: 'No players found',
    description: 'Try adjusting your search or filter criteria.',
};

const PLAYER_CELL_MIN_WIDTH = '--player-cell-min-width';

/**
 * Each group is its own table, and each table sizes its Player column to its own longest
 * entry, so the fixture columns would not line up from group to group. This widens every
 * Player cell to the widest on the page. It is cleared before measuring, so the widest is
 * the content's own width rather than the last value set.
 */
/** The club for the "Selected" summary. A club missing from the teams list (e.g. newly promoted) must not crash the page. */
function selectedTeamLabel(
    playerCode: number,
    playersByCode: Record<number, EnhancedPlayerData>,
    teamsByCode: Record<number, FplTeam>,
): string {
    const teamCode = playersByCode[playerCode]?.team_code;
    if (teamCode === undefined) return '';
    return teamsByCode[teamCode]?.name ?? `Team ${teamCode}`;
}

function alignPlayerColumns(list: HTMLElement) {
    list.style.removeProperty(PLAYER_CELL_MIN_WIDTH);
    const widths = Array.from(list.querySelectorAll('tbody td:first-child > *'), (cell) =>
        Math.ceil(cell.getBoundingClientRect().width),
    );
    const widest = Math.max(0, ...widths);
    if (widest > 0) list.style.setProperty(PLAYER_CELL_MIN_WIDTH, `${widest}px`);
}

export function PlayerOutSelector({
    teamsByCode,
    playersByCode,
    roster,
    selectedPlayer,
    onPlayerChange,
    transferType,
    categoryStandings = [],
    upcomingFixturesByTeamCode = {},
    availabilityByCode = {},
    availablePlayers = [],
    embeddedInJourney = false,
}: PlayerOutSelectorProps) {
    const rosterPlayersByCode: Record<number, RosterPlayer> = Object.fromEntries(
        Object.values(roster).map(({ player }) => [player.playerCode, player]),
    );
    const groups = groupRosterByCategory(roster, playersByCode, categoryStandings);

    // The grouping drops roster players missing from playersByCode (their stats
    // have not loaded yet) rather than crashing. Name them so a manager left
    // unable to transfer someone out knows why.
    const missingPlayers = Object.values(roster)
        .map((slot) => slot.player)
        .filter((player) => playersByCode[player.playerCode] === undefined);

    const handlePlayerClick = (player: EnhancedPlayerData) => {
        if (selectedPlayer?.playerCode === player.code) {
            onPlayerChange(null);
        } else {
            onPlayerChange(rosterPlayersByCode[player.code]);
        }
    };
    const positionRanksByCode = useMemo(() => buildPositionRanksByCode(availablePlayers), [availablePlayers]);
    const columns = getTransferOutColumns(
        teamsByCode,
        upcomingFixturesByTeamCode,
        positionRanksByCode,
        availabilityByCode,
    );

    // Re-measured after every render (12 cells, cheap) and again once the web font has
    // loaded, since names change width when it swaps in.
    const playerListRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const list = playerListRef.current;
        if (!list) return;
        alignPlayerColumns(list);
        let active = true;
        document.fonts?.ready.then(() => {
            if (active) alignPlayerColumns(list);
        });
        return () => {
            active = false;
        };
    });

    return (
        <div className={`${styles.playerOutSelector} ${embeddedInJourney ? styles.embeddedInJourney : ''}`}>
            {embeddedInJourney ? null : (
                <div className={styles.selectorHeader}>
                    <h3 className={styles.selectorTitle}>Transfer Out</h3>
                    <p className={styles.selectorDescription}>Select a player from your current squad</p>
                </div>
            )}

            {/* Player List, grouped the way the league table scores it */}
            <div className={styles.playerList} ref={playerListRef}>
                {missingPlayers.length > 0 ? (
                    <p className={styles.selectorDescription}>
                        {missingPlayers.length === 1
                            ? `${missingPlayers[0]?.playerName} is unavailable for transfer right now: their latest stats have not loaded yet.`
                            : `${missingPlayers.length} squad players are unavailable for transfer right now: their latest stats have not loaded yet.`}
                    </p>
                ) : null}
                {groups.length === 0 ? <Table data={[]} columns={columns} empty={EMPTY_STATE} /> : null}
                {groups.map((group) => (
                    <section key={group.key} className={styles.categoryGroup} aria-label={group.label}>
                        <CategoryStandingHeader label={group.label} standing={group.standing} />
                        {/* Not sortable: a group is one category's two players, already in slot order. */}
                        <Table
                            data={group.players}
                            columns={columns}
                            sortable={false}
                            onRowClick={(player) => handlePlayerClick(player)}
                            getRowProps={(player) => {
                                return {
                                    className: `${styles.playerItem} ${selectedPlayer?.playerCode === player.code ? styles.selected : ''}`,
                                };
                            }}
                        />
                    </section>
                ))}
            </div>

            {/* Selected Player Display */}
            {selectedPlayer && (
                <div className={styles.selectedSummary}>
                    <div className={styles.summaryHeader}>
                        <span className={styles.summaryLabel}>Selected:</span>
                        <span className={styles.summaryPlayer}>
                            <strong>{selectedPlayer.playerName}</strong>
                            <span className={styles.summaryDetails}>
                                {' '}
                                {selectedPlayer.playerPosition} •{' '}
                                {selectedTeamLabel(selectedPlayer.playerCode, playersByCode, teamsByCode)}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
