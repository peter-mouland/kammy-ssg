// app/teams/components/stats-view-toggle.tsx
import type React from 'react';
import { GenericToggle } from '../../_shared/components/toggle';
import type { StatsViewToggleProps } from '../types/team-types';

export const StatsViewToggle: React.FC<StatsViewToggleProps> = ({ viewMode, onToggle }) => {
    const options = [
        {
            value: 'gameweek',
            label: 'Gameweek',
            icon: '📅',
            title: 'View gameweek stats',
        },
        {
            value: 'season',
            label: 'Season',
            icon: '📊',
            title: 'View season stats',
        },
    ] as const;

    return <GenericToggle options={options} activeValue={viewMode} onToggle={onToggle} />;
};
