/* Location: app/players/components/player-fixxture-table.tsx */

import { Table, type TableColumn } from '../../_shared/components/table';
import type { EventData, FplTeam } from '../../_shared/lib/fpl/fpl-types';

interface FixtureData {
    difficulty: number;
    is_home: boolean;
    kickoff_time: string;
    event_name: string;
    eventId: number;
    event: EventData; //fplEvents[f.event],
    team_a_id: number;
    team_a: FplTeam; //fplTeamsById[f.team_a],
    team_h_id: number; // f.team_h_id,
    team_h: FplTeam; //fplTeamsById[f.team_h],
}

export function PlayerFixtureTable({ fixtureData }) {
    const columns: TableColumn<FixtureData>[] = [
        {
            key: 'gameweek',
            header: 'GW',
            accessor: 'eventId',
            width: 80,
            fixed: true,
            render: (_gameweek, fixture) => (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexDirection: 'row' }}
                    >
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{fixture.event_name}</span>
                        <span>
                            {new Date(fixture.kickoff_time).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </span>
                    </div>
                ),
        },
        {
            key: 'opponent',
            header: 'Opponent',
            width: 80,
            fixed: true,
            render: (_, fixture) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>
                        {fixture.is_home ? '' : '@'}
                        {fixture.is_home ? fixture.team_a.name : fixture.team_h.name}
                    </span>
                </div>
            ),
        },
        {
            key: 'difficulty',
            header: 'Difficulty',
            width: 80,
            fixed: true,
            render: (_, fixture) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>{fixture.difficulty}</span>
                </div>
            ),
        },
    ];

    return (
        <Table
            data={fixtureData}
            columns={columns}
            sortable={false} // Gameweeks are naturally ordered
            size="compact"
            bordered
            empty={{
                icon: '📊',
                title: 'No gameweek data available',
                description: 'Player statistics will appear once gameweeks are played',
            }}
            containerClassName="gameweek-table"
        />
    );
}
