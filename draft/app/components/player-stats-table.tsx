import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Table, type TableColumn, PositionBadge, TableBadge } from "./table";
import { PointsBreakdownTooltip } from './points-breakdown-tooltip';
import type { EnhancedPlayerData } from "../types";
import { isStatRelevant } from '../lib/is-stat-relevant';

interface PlayerStatsTableProps {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Record<string, string>;
}

export function PlayerStatsTable({ players, teams, positions }: PlayerStatsTableProps) {
    const [nameFilter, setNameFilter] = useState('');
    const [positionFilter, setPositionFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
console.log(teams)
    // Filter players based on current filters
    const filteredPlayers = useMemo(() => {
        return players.filter(player => {
            const matchesName = nameFilter === '' ||
                player.web_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                `${player.first_name} ${player.second_name}`.toLowerCase().includes(nameFilter.toLowerCase());

            const matchesPosition = positionFilter === '' || player.draft.position === positionFilter;
            const matchesTeam = teamFilter === '' || player.team_name === teamFilter;

            return matchesName && matchesPosition && matchesTeam;
        });
    }, [players, nameFilter, positionFilter, teamFilter]);

    // Helper function to format stat value
    const formatStatValue = (value: number, stat: string, position: string): string => {
        if (!isStatRelevant(stat, position)) {
            return '-';
        }
        return value?.toString() || '0';
    };

    const columns: TableColumn<EnhancedPlayerData>[] = [
        {
            key: 'position',
            header: 'Pos',
            accessor: 'position',
            width: 60,
            align: 'center',
            render: (position) => console.log(position) || (
                <PositionBadge position={position}>
                    {position}
                </PositionBadge>
            )
        },
        {
            key: 'player',
            header: 'Player',
            sortable: true,
            sortKey: 'web_name',
            fixed: true,
            minWidth: 140,
            render: (_, player) => (
                <Link
                    to={`/players/${player.id}`}
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        transition: 'var(--transition-normal)'
                    }}
                >
                    <div>
                        <div style={{
                            fontWeight: 'var(--font-weight-medium)',
                            fontSize: '0.95em'
                        }}>
                            {player.first_name} {player.second_name}
                        </div>
                    </div>
                </Link>
            )
        },
        {
            key: 'team',
            header: 'Team',
            accessor: 'team_code',
            sortable: true,
            hideOnMobile: true,
            variant: 'muted',
            render: (team_code) => teams[team_code]
        },
        {
            key: 'form',
            header: 'Form',
            accessor: 'form',
            sortable: true,
            variant: 'success',
            width: 60,
            render: (form) => {
                const formNum = parseFloat(form);
                const variant = formNum >= 4 ? 'success' : formNum <= 2 ? 'error' : 'warning';
                return <TableBadge variant={variant}>{form}</TableBadge>;
            }
        },
        {
            key: 'price',
            header: 'Price',
            accessor: 'now_cost',
            sortable: true,
            variant: 'numeric',
            render: (cost) => `£${(cost / 10).toFixed(1)}m`
        },
        {
            key: 'minutes',
            header: 'Min',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => player.draft.pointsBreakdown.appearance.stat
        },
        {
            key: 'goals',
            header: 'Goals',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => player.draft.pointsBreakdown.goals.stat
        },
        {
            key: 'assists',
            header: 'Assists',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => player.draft.pointsBreakdown.assists.stat
        },
        {
            key: 'cleanSheets',
            header: 'CS',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => formatStatValue(
                player.draft.pointsBreakdown.cleanSheets.stat,
                'clean_sheets',
                player.draft.position
            )
        },
        {
            key: 'goalsConceded',
            header: 'GC',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => formatStatValue(
                player.draft.pointsBreakdown.goalsConceded?.stat,
                'goals_conceded',
                player.draft.position
            )
        },
        {
            key: 'penaltiesSaved',
            header: 'PS',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => formatStatValue(
                player.draft.pointsBreakdown.penaltiesSaved?.stat,
                'penalties_saved',
                player.draft.position
            )
        },
        {
            key: 'yellowCards',
            header: 'YC',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => player.draft.pointsBreakdown.yellowCards.stat
        },
        {
            key: 'redCards',
            header: 'RC',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => player.draft.pointsBreakdown.redCards.stat
        },
        {
            key: 'bonus',
            header: 'Bonus',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => formatStatValue(
                player.draft.pointsBreakdown.bonus?.stat,
                'bonus',
                player.draft.position
            )
        },
        {
            key: 'saves',
            header: 'Saves',
            align: 'center',
            hideOnMobile: true,
            render: (_, player) => formatStatValue(
                player.draft.pointsBreakdown.saves?.stat,
                'saves',
                player.draft.position
            )
        },
        {
            key: 'customPoints',
            header: 'Custom Pts',
            accessor: 'draft.pointsTotal',
            sortable: true,
            variant: 'error',
            align: 'center',
            render: (_, player) => (
                <PointsBreakdownTooltip player={player}>
                    <span style={{
                        cursor: 'help',
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'var(--transition-normal)',
                        display: 'inline-block',
                        fontWeight: 'var(--font-weight-bold)'
                    }}>
                        {player.draft.pointsTotal}
                    </span>
                </PointsBreakdownTooltip>
            )
        }
    ];

    return (
        <div>
            {/* Filters */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)',
                border: 'var(--card-border)'
            }}>
                <div>
                    <label style={{
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-700)',
                        marginBottom: 'var(--spacing-1)',
                        display: 'block'
                    }}>
                        Search Player
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        style={{
                            padding: 'var(--input-padding)',
                            border: 'var(--input-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            backgroundColor: 'var(--color-white)',
                            width: '100%'
                        }}
                    />
                </div>

                <div>
                    <label style={{
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-700)',
                        marginBottom: 'var(--spacing-1)',
                        display: 'block'
                    }}>
                        Position
                    </label>
                    <select
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        style={{
                            padding: 'var(--input-padding)',
                            border: 'var(--input-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            backgroundColor: 'var(--color-white)',
                            width: '100%'
                        }}
                    >
                        <option value="">All Positions</option>
                        {Object.keys(positions).map(position => (
                            <option key={position} value={position}>{position}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-700)',
                        marginBottom: 'var(--spacing-1)',
                        display: 'block'
                    }}>
                        Team
                    </label>
                    <select
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                        style={{
                            padding: 'var(--input-padding)',
                            border: 'var(--input-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            backgroundColor: 'var(--color-white)',
                            width: '100%'
                        }}
                    >
                        <option value="">All Teams</option>
                        {Object.keys(teams).map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'end',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-gray-500)',
                    fontWeight: 'var(--font-weight-medium)'
                }}>
                    Showing {filteredPlayers.length} of {players.length} players
                </div>
            </div>

            {/* Table */}
            <Table
                data={filteredPlayers}
                columns={columns}
                defaultSort={{ key: 'customPoints', direction: 'desc' }}
                size="compact"
                maxHeight="600px"
                empty={{
                    icon: '🔍',
                    title: 'No players found',
                    description: 'Try adjusting your search filters'
                }}
                containerClassName="player-stats-table"
            />
        </div>
    );
}
