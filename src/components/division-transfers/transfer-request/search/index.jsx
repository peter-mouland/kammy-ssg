import React, { useState } from 'react';
import Select from 'react-select';
import bemHelper from '@kammy/bem';

import createFilteredPlayers from '../../lib/create-filtered-players';
import Spacer from '../../../spacer';
import Players from '../components/Players';

const bem = bemHelper({ block: 'transfers-page' });

const createFilterOptions = ({ positions, managers = [], managerId }) => [
    {
        label: 'Managers',
        options: [
            { value: 'available', label: 'No manager (free agents)', group: 'manager' },
            ...managers.map(({ id, label }) => ({
                value: id,
                label: `${label}${id === managerId ? '*' : ''}`,
                group: 'manager',
            })),
        ],
    },
    {
        label: 'Positions',
        options: positions.playerPositions.map((position) => ({
            value: position.id,
            label: position.label,
            group: 'position',
        })),
    },
    {
        label: 'Misc',
        options: [
            { value: 'isNew', label: 'New Players', group: 'misc' },
            { value: 'isSub', label: 'Sub(s)', group: 'misc' },
            { value: 'isPending', label: 'Pending transfers', group: 'misc' },
        ],
    },
];

const Search = ({ positions, managers, managerId, teams, searchText, players, defaultFilter, onSelect, transfers }) => {
    const filterOptions = createFilterOptions({ positions, managers, managerId, players });
    const [playerFilter, setPlayerFilter] = useState(defaultFilter);

    const filteredPlayers = createFilteredPlayers({
        selectedOptions: playerFilter,
        players,
        teams,
        transfers,
    });
    return (
        <Spacer all={{ vertical: Spacer.spacings.HUGE, horizontal: Spacer.spacings.SMALL }}>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <h3>Search:</h3>
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                {searchText && <div className={bem('hint')}>{searchText}</div>}
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <div style={{ position: 'relative', zIndex: '2' }}>
                    <Select
                        value={playerFilter}
                        placeholder="player filter..."
                        options={filterOptions}
                        isMulti
                        name="playersFiltersOut"
                        onChange={setPlayerFilter}
                    />
                </div>
            </Spacer>
            <div style={{ position: 'relative', zIndex: '1' }}>
                {players.all.length > 0 && <Players onSelect={onSelect} playersArray={filteredPlayers} />}
            </div>
        </Spacer>
    );
};

export default Search;
