import { Link } from "react-router";
import { Icon } from "./icon";
import { Table, type TableColumn } from "./table";
import type { FplPlayerData } from "../types";

interface TopPlayersProps {
    players: FplPlayerData[];
}

export function TopPlayers({ players }: TopPlayersProps) {
    const columns: TableColumn<FplPlayerData>[] = [
        {
            key: 'rank',
            header: '#',
            width: 50,
            align: 'center',
            variant: 'bold',
            render: (_, __, index) => `#${index + 1}`
        },
        {
            key: 'player',
            header: 'Player',
            sortable: true,
            sortKey: 'second_name',
            render: (_, player) => (
                <div>
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-900)' }}>
                        {player.first_name} {player.second_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-gray-500)' }}>
                        #{player.id}
                    </div>
                </div>
            )
        },
        {
            key: 'team',
            header: 'Team',
            accessor: 'team_code',
            sortable: true,
            variant: 'muted',
            hideOnMobile: true
        },
        {
            key: 'points',
            header: 'Points',
            accessor: 'total_points',
            sortable: true,
            variant: 'numeric',
            render: (points) => points.toLocaleString()
        },
        {
            key: 'price',
            header: 'Price',
            accessor: 'now_cost',
            sortable: true,
            variant: 'success',
            align: 'right',
            render: (cost) => `£${(cost / 10).toFixed(1)}m`
        }
    ];

    // Show only top 10 players
    const topPlayers = players.slice(0, 10);

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <Icon type="trophy" /> Top FPL Players
                </h2>
                <p style={{ color: 'var(--color-gray-500)', margin: 'var(--spacing-2) 0 0 0' }}>
                    Best performing players this season
                </p>
            </div>

            <Table
                data={topPlayers}
                columns={columns}
                maxHeight="400px"
                sortable={false} // Pre-sorted by points
                size="compact"
                empty={{
                    icon: '🏆',
                    title: 'No player data',
                    description: 'Player statistics will appear once data is loaded'
                }}
                onRowClick={(player) => {
                    // Navigate to player detail page
                    window.location.href = `/players/${player.id}`;
                }}
            />

            <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>
                <Link to="/players" className="btn btn-secondary">
                    View All Players
                </Link>
            </div>
        </div>
    );
}
