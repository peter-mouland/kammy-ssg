/* Location: app/players/components/player-gameweek-table.tsx */

import { Table, TableBadge, type TableColumn } from '../../_shared/components/table';
import {
    calculateAppearancePoints,
    calculateAssistPoints,
    calculateBonus,
    calculateCleanSheetPoints,
    calculateGameweekPoints,
    calculateGoalPoints,
    calculateGoalsConcededPenalty,
    calculatePenaltiesSaved,
    calculateRedCardPenalty,
    calculateSavesBonus,
    calculateYellowCardPenalty,
    formatPointsDisplay,
    isStatRelevant,
} from '../../scoring/lib';
import { convertToGameweekStats } from '../../scoring/lib/data-conversion';
import type { GameweekStatWithPoints } from '../../scoring/types/scoring-types';
import type { CustomPosition } from '../types/player-types';

// import { PointsBreakdownTooltip } from './points-breakdown-tooltip'

interface PlayerGameweekTableProps {
    gameweekStats: GameweekStatWithPoints[];
    position: CustomPosition;
    currentGameweek: number;
}

const getStatDisplay = (value: number, stat: string, position: string): React.ReactNode => {
    if (!isStatRelevant(stat, position)) {
        return '-';
    }

    if (value === 0) return '0';

    // Color coding for different stats
    if (['goals', 'assists', 'cleanSheets', 'saves', 'penaltiesSaved', 'bonus'].includes(stat)) {
        return <span style={{ color: 'var(--color-success)' }}>{value}</span>;
    }

    if (['goalsConceded', 'yellowCards', 'redCards'].includes(stat)) {
        return <span style={{ color: 'var(--color-error)' }}>{value}</span>;
    }

    return value;
};

const renderMatchResult = (gw: GameweekStatWithPoints): React.ReactNode => {
    if (gw.minutes === 0) {
        return <TableBadge variant="gray">DNP</TableBadge>;
    }

    const playerScore = gw.wasHome ? gw.teamHScore : gw.teamAScore;
    const opponentScore = gw.wasHome ? gw.teamAScore : gw.teamHScore;

    let variant: 'success' | 'warning' | 'error' = 'warning';
    if (playerScore > opponentScore) variant = 'success';
    if (playerScore < opponentScore) variant = 'error';

    return (
        <TableBadge variant={variant}>
            {gw.wasHome ? 'H' : 'A'} {playerScore}-{opponentScore}
        </TableBadge>
    );
};

/**
 * Calculate rolling form (last 5 games) up to the current gameweek
 */
const calculateRollingForm = (gameweekStats: GameweekStatWithPoints[], currentIndex: number): number => {
    // Get games up to and including current gameweek, filter for played games
    const gamesUpToCurrent = gameweekStats
        .slice(currentIndex) // From current gameweek onwards (data is sorted desc)
        .filter((gw) => gw.minutes > 0)
        .slice(0, 5); // Take up to 5 games

    if (gamesUpToCurrent.length === 0) return 0;

    const totalPoints = gamesUpToCurrent.reduce((sum, gw) => sum + gw.fplPoints, 0);
    return Math.round((totalPoints / gamesUpToCurrent.length) * 10) / 10;
};

export function PlayerGameweekTable({ gameweekStats, position, currentGameweek }: PlayerGameweekTableProps) {
    const columns: TableColumn<GameweekStatWithPoints>[] = [
        {
            key: 'gameweek',
            header: 'GW',
            accessor: 'gameweek',
            width: 80,
            fixed: true,
            render: (gameweek, _gw) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{gameweek}</span>
                    {gameweek === currentGameweek && <TableBadge variant="error">LIVE</TableBadge>}
                </div>
            ),
        },
        {
            key: 'minutes',
            header: 'Min',
            accessor: 'minutes',
            align: 'center',
            width: 60,
            title: (stat) => `${calculateAppearancePoints(stat.minutes, position)} points`,
            render: (minutes) =>
                minutes === 0 ? (
                    <span style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>0</span>
                ) : (
                    minutes
                ),
        },
        {
            key: 'goals',
            header: 'Goals',
            accessor: 'goals',
            align: 'center',
            width: 60,
            title: (stat) => `${calculateGoalPoints(stat.goals, position)} points`,
            render: (goals) => getStatDisplay(goals, 'goals', position),
        },
        {
            key: 'assists',
            header: 'Assists',
            accessor: 'assists',
            align: 'center',
            width: 70,
            title: (stat) => `${calculateAssistPoints(stat.assists, position)} points`,
            render: (assists) => getStatDisplay(assists, 'assists', position),
        },
    ];

    // Add position-specific columns
    if (isStatRelevant('cleanSheets', position)) {
        columns.push({
            key: 'cleanSheets',
            header: 'CS',
            accessor: 'cleanSheets',
            align: 'center',
            width: 50,
            title: (stats) => `${calculateCleanSheetPoints(stats.cleanSheets, position)} points`,
            render: (cs) => getStatDisplay(cs, 'cleanSheets', position),
        });
    }

    if (isStatRelevant('goalsConceded', position)) {
        columns.push({
            key: 'goalsConceded',
            header: 'GC',
            accessor: 'goalsConceded',
            align: 'center',
            width: 50,
            title: (stat) => `${calculateGoalsConcededPenalty(stat.goalsConceded, position)} points`,
            render: (gc) => getStatDisplay(gc, 'goalsConceded', position),
        });
    }

    if (isStatRelevant('saves', position)) {
        columns.push({
            key: 'saves',
            header: 'Saves',
            accessor: 'saves',
            align: 'center',
            width: 60,
            title: (stat) => `${calculateSavesBonus(stat.saves, position)} points`,
            render: (saves) => getStatDisplay(saves, 'saves', position),
        });
    }

    if (isStatRelevant('penaltiesSaved', position)) {
        columns.push({
            key: 'penaltiesSaved',
            header: 'Pen S',
            accessor: 'penaltiesSaved',
            align: 'center',
            width: 60,
            title: (stat) => `${calculatePenaltiesSaved(stat.penaltiesSaved, position)} points`,
            render: (ps) => getStatDisplay(ps, 'penaltiesSaved', position),
        });
    }

    // Always show cards
    columns.push(
        {
            key: 'yellowCards',
            header: 'YC',
            accessor: 'yellowCards',
            align: 'center',
            width: 50,
            title: (stat) => `${calculateYellowCardPenalty(stat.yellowCards, position)} points`,
            render: (yc) => getStatDisplay(yc, 'yellowCards', position),
        },
        {
            key: 'redCards',
            header: 'RC',
            accessor: 'redCards',
            align: 'center',
            width: 50,
            title: (stat) => `${calculateRedCardPenalty(stat.redCards, position)} points`,
            render: (rc) => getStatDisplay(rc, 'redCards', position),
        },
    );

    // Add bonus if relevant
    if (isStatRelevant('bonus', position)) {
        columns.push({
            key: 'bonus',
            header: 'Bonus',
            accessor: 'bonus',
            align: 'center',
            width: 60,
            title: (stat) => calculateBonus(stat.bonus, position) + ' points',
            render: (bonus) => getStatDisplay(bonus, 'bonus', position),
        });
    }
    // Add bonus if relevant
    if (isStatRelevant('defensiveContribution', position)) {
        columns.push({
            key: 'defensiveContribution',
            header: 'DC',
            accessor: 'defensiveContribution',
            align: 'center',
            width: 60,
            title: (stat) => `${calculateBonus(stat.defensiveContribution, position)} points`,
            render: (bonus) => getStatDisplay(bonus, 'defensiveContribution', position),
        });
    }

    // Add form column (after stats, before points)
    columns.push({
        key: 'form',
        header: 'Form',
        align: 'center',
        width: 60,
        title: () => 'Rolling average over last 5 played games',
        render: (_, gw, index) => {
            const form = calculateRollingForm(gameweekStats, index);
            const color =
                form >= 4 ? 'var(--color-success)' : form <= 2 ? 'var(--color-error)' : 'var(--color-gray-600)';

            return (
                <span style={{ color, fontWeight: 'var(--font-weight-medium)' }}>
                    {form > 0 ? form.toFixed(1) : '-'}
                </span>
            );
        },
    });

    // Add points columns
    columns.push(
        {
            key: 'customPoints',
            header: 'Points',
            align: 'center',
            width: 90,
            variant: 'bold',
            render: (_, gw) => {
                const { total } = calculateGameweekPoints([convertToGameweekStats(gw)], position);
                const color =
                    total > 0 ? 'var(--color-success)' : total < 0 ? 'var(--color-error)' : 'var(--color-gray-500)';

                return (
                    <span
                        style={{
                            color,
                            fontWeight: 'var(--font-weight-semibold)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: 'var(--spacing-1) var(--spacing-2)',
                            borderRadius: 'var(--radius-sm)',
                        }}
                    >
                        {formatPointsDisplay(total)}
                    </span>
                );
            },
        },
        {
            key: 'opponent',
            header: 'Opponent',
            width: 100,
            hideOnMobile: true,
            render: (_, gw) => (
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                    <span style={{ color: 'var(--color-gray-800)' }}>
                        {gw.wasHome ? '' : '@'}
                        {gw.opponentName || `Team ${gw.opponent}`}
                    </span>
                </div>
            ),
        },
        {
            key: 'result',
            header: 'Result',
            width: 80,
            align: 'center',
            hideOnMobile: true,
            render: (_, gw) => renderMatchResult(gw),
        },
    );

    return (
        <Table
            data={gameweekStats}
            columns={columns}
            sortable={false} // Gameweeks are naturally ordered
            size="compact"
            bordered
            empty={{
                icon: '📊',
                title: 'No gameweek data available',
                description: 'Player statistics will appear once gameweeks are played',
            }}
            rowClassName={(gw) => {
                const classes = [];
                if (gw.gameweek === currentGameweek) classes.push('current-gameweek');
                if (!gw.customPoints) classes.push('no-custom-points');
                return classes.join(' ');
            }}
            containerClassName="gameweek-table"
        />
    );
}
