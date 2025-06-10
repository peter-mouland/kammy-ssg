import { Table, type TableColumn, TableBadge } from "../../_shared/components/table";
import { isStatRelevant, formatPointsDisplay } from '../../scoring/lib';

interface GameweekStatWithPoints {
    gameweek: number;
    minutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    bonus: number;
    opponent: number;
    opponentName?: string;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;
    customPoints: {
        appearance: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        yellowCards: number;
        redCards: number;
        saves: number;
        penaltiesSaved: number;
        bonus: number;
        total: number;
    } | null;
    fplPoints: number;
    generatedAt: string | null;
}

interface PlayerGameweekTableProps {
    gameweekStats: GameweekStatWithPoints[];
    position: string;
    currentGameweek: number;
}

export function PlayerGameweekTable({
                                        gameweekStats,
                                        position,
                                        currentGameweek
                                    }: PlayerGameweekTableProps) {
    // Helper functions
    const getStatDisplay = (value: number, stat: string, position: string): React.ReactNode => {
        if (!isStatRelevant(stat, position)) {
            return '-';
        }

        if (value === 0) return '0';

        // Color coding for different stats
        if (stat === 'goals' || stat === 'assists' || stat === 'clean_sheets' ||
            stat === 'saves' || stat === 'penalties_saved' || stat === 'bonus') {
            return <span style={{ color: 'var(--color-success)' }}>{value}</span>;
        }

        if (stat === 'goals_conceded' || stat === 'yellow_cards' || stat === 'red_cards') {
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

    const columns: TableColumn<GameweekStatWithPoints>[] = [
        {
            key: 'gameweek',
            header: 'GW',
            accessor: 'gameweek',
            width: 80,
            fixed: true,
            render: (gameweek, gw) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {gameweek}
                    </span>
                    {gameweek === currentGameweek && (
                        <TableBadge variant="error">LIVE</TableBadge>
                    )}
                </div>
            )
        },
        {
            key: 'minutes',
            header: 'Min',
            accessor: 'minutes',
            align: 'center',
            width: 60,
            render: (minutes) => minutes === 0 ?
                <span style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>0</span> :
                minutes
        },
        {
            key: 'goals',
            header: 'Goals',
            accessor: 'goals',
            align: 'center',
            width: 60,
            render: (goals) => getStatDisplay(goals, 'goals', position)
        },
        {
            key: 'assists',
            header: 'Assists',
            accessor: 'assists',
            align: 'center',
            width: 70,
            render: (assists) => getStatDisplay(assists, 'assists', position)
        }
    ];

    // Add position-specific columns
    if (isStatRelevant('clean_sheets', position)) {
        columns.push({
            key: 'cleanSheets',
            header: 'CS',
            accessor: 'cleanSheets',
            align: 'center',
            width: 50,
            render: (cs) => getStatDisplay(cs, 'clean_sheets', position)
        });
    }

    if (isStatRelevant('goals_conceded', position)) {
        columns.push({
            key: 'goalsConceded',
            header: 'GC',
            accessor: 'goalsConceded',
            align: 'center',
            width: 50,
            render: (gc) => getStatDisplay(gc, 'goals_conceded', position)
        });
    }

    if (isStatRelevant('saves', position)) {
        columns.push({
            key: 'saves',
            header: 'Saves',
            accessor: 'saves',
            align: 'center',
            width: 60,
            render: (saves) => getStatDisplay(saves, 'saves', position)
        });
    }

    if (isStatRelevant('penalties_saved', position)) {
        columns.push({
            key: 'penaltiesSaved',
            header: 'Pen S',
            accessor: 'penaltiesSaved',
            align: 'center',
            width: 60,
            render: (ps) => getStatDisplay(ps, 'penalties_saved', position)
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
            render: (yc) => getStatDisplay(yc, 'yellow_cards', position)
        },
        {
            key: 'redCards',
            header: 'RC',
            accessor: 'redCards',
            align: 'center',
            width: 50,
            render: (rc) => getStatDisplay(rc, 'red_cards', position)
        }
    );

    // Add bonus if relevant
    if (isStatRelevant('bonus', position)) {
        columns.push({
            key: 'bonus',
            header: 'Bonus',
            accessor: 'bonus',
            align: 'center',
            width: 60,
            render: (bonus) => getStatDisplay(bonus, 'bonus', position)
        });
    }

    // Add points columns
    columns.push(
        {
            key: 'customPoints',
            header: 'Custom Pts',
            align: 'center',
            width: 90,
            variant: 'bold',
            render: (_, gw) => {
                if (!gw.customPoints) {
                    return <span style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>-</span>;
                }

                const total = gw.customPoints.total;
                const color = total > 0 ? 'var(--color-success)' :
                    total < 0 ? 'var(--color-error)' : 'var(--color-gray-500)';

                return (
                    <span style={{
                        color,
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: 'var(--color-primary-light)',
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        {formatPointsDisplay(total)}
                    </span>
                );
            }
        },
        {
            key: 'fplPoints',
            header: 'FPL Pts',
            accessor: 'fplPoints',
            align: 'center',
            width: 80,
            variant: 'bold',
            render: (fplPoints) => {
                const color = fplPoints > 0 ? 'var(--color-success)' :
                    fplPoints < 0 ? 'var(--color-error)' : 'var(--color-gray-500)';

                return (
                    <span style={{
                        color,
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: 'var(--color-gray-50)',
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        {fplPoints}
                    </span>
                );
            }
        },
        {
            key: 'opponent',
            header: 'Opponent',
            width: 100,
            hideOnMobile: true,
            render: (_, gw) => (
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                    <span style={{ color: 'var(--color-gray-800)' }}>
                        {gw.wasHome ? '' : '@'}{gw.opponentName || `Team ${gw.opponent}`}
                    </span>
                </div>
            )
        },
        {
            key: 'result',
            header: 'Result',
            width: 80,
            align: 'center',
            hideOnMobile: true,
            render: (_, gw) => renderMatchResult(gw)
        }
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
                description: 'Player statistics will appear once gameweeks are played'
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
