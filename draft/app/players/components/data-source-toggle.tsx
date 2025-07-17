// app/players/components/data-source-toggle.tsx
import type React from 'react';
import { useSearchParams } from 'react-router';
import { GenericToggle } from '../../_shared/components/toggle';

export type DataSource = 'fpl' | '2425';

export interface DataSourceToggleProps {
    dataSource: DataSource;
}

export const DataSourceToggle: React.FC<DataSourceToggleProps> = ({ dataSource }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleToggle = (newDataSource: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (newDataSource === 'fpl') {
            newParams.delete('source'); // Default is FPL, so remove param
        } else {
            newParams.set('source', newDataSource);
        }
        setSearchParams(newParams);
    };

    const options = [
        {
            value: 'fpl',
            label: 'Current',
            icon: '📈',
            title: 'View current FPL season data',
        },
        {
            value: '2425',
            label: '24/25',
            icon: '📊',
            title: 'View 2024/25 season data',
        },
    ] as const;

    return <GenericToggle options={options} activeValue={dataSource} onToggle={handleToggle} />;
};
