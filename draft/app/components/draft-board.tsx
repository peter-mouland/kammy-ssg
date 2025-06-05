import { Table, type TableColumn } from "./table";
import { getPositionDisplayName } from '../lib/points';

interface DraftPickData {
    pickNumber: number;
    userId: string;
    playerName: string;
    position: string;
    teamName: string;
}

interface DraftBoardProps {
    draftPicks: DraftPickData[];
}

export function DraftBoard({ draftPicks }: DraftBoardProps) {
    const columns: TableColumn<DraftPickData>[] = [
        {
            key: 'pickNumber',
            header: '#',
            accessor: 'pickNumber',
            width: 60,
            align: 'center',
            variant: 'bold',
            render: (pickNumber) => `#${pickNumber}`
        },
        {
            key: 'playerName',
            header: 'Player',
            accessor: 'playerName',
            variant: 'bold',
            minWidth: 150
        },
        {
            key: 'position',
            header: 'Position',
            accessor: 'position',
            align: 'center',
            hideOnMobile: true,
            render: (position) => getPositionDisplayName(position)
        },
        {
            key: 'teamName',
            header: 'Team',
            accessor: 'teamName',
            hideOnMobile: true,
            variant: 'muted'
        },
        {
            key: 'manager',
            header: 'Drafted By',
            accessor: 'userId',
            variant: 'muted',
            render: (userId) => userId // You might want to map this to actual manager names
        }
    ];

    // Sort picks by most recent first (highest pick number)
    const sortedPicks = [...draftPicks]
        .sort((a, b) => b.pickNumber - a.pickNumber)
        .slice(0, 20); // Show last 20 picks

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Draft Board</h2>
                <p style={{ color: 'var(--color-gray-500)' }}>
                    {draftPicks.length} picks made
                </p>
            </div>

            <Table
                data={sortedPicks}
                columns={columns}
                size="compact"
                maxHeight="350px"
                sortable={false} // Already sorted by recency
                empty={{
                    icon: '📋',
                    title: 'No picks made yet',
                    description: 'Draft will begin soon!'
                }}
                rowClassName={(pick, index) => {
                    // Highlight recent picks
                    if (index < 3) return 'recent-pick';
                    return '';
                }}
            />
        </div>
    );
}
