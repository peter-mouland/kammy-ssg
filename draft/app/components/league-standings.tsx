import { Link } from "react-router";
import { Icon } from "./icon";
import { Table, type TableColumn, RankBadge, TableBadge } from "./table";
import type { UserTeamData } from "../types";

interface LeagueStandingsProps {
    standings: UserTeamData[];
}

export function LeagueStandings({ standings }: LeagueStandingsProps) {
    const columns: TableColumn<UserTeamData>[] = [
        {
            key: 'rank',
            header: 'Rank',
            accessor: 'leagueRank',
            width: 80,
            align: 'center',
            render: (rank) => <RankBadge rank={rank} isTop={rank <= 3} />
        },
        {
            key: 'team',
            header: 'Team',
            accessor: 'teamName',
            sortable: true,
            variant: 'bold',
            render: (teamName, team) => (
                <div>
                    <div>{teamName}</div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-gray-500)' }}>
                        <TableBadge variant="gray">Division {team.divisionId}</TableBadge>
                    </div>
                </div>
            )
        },
        {
            key: 'manager',
            header: 'Manager',
            accessor: 'userName',
            sortable: true,
            variant: 'muted',
            hideOnMobile: true
        },
        {
            key: 'points',
            header: 'Points',
            accessor: 'totalPoints',
            sortable: true,
            variant: 'numeric',
            render: (points) => points?.toLocaleString() || '0'
        }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <Icon type="chart" /> League Standings
                </h2>
                <p style={{ color: 'var(--color-gray-500)', margin: 'var(--spacing-2) 0 0 0' }}>
                    Top teams across all divisions
                </p>
            </div>

            <Table
                data={standings}
                columns={columns}
                maxHeight="400px"
                defaultSort={{ key: 'points', direction: 'desc' }}
                empty={{
                    icon: '📊',
                    title: 'No standings available',
                    description: 'Standings will appear once teams are created'
                }}
                rowClassName={(team) => team.leagueRank <= 3 ? 'highlight-top' : ''}
            />
        </div>
    );
}
