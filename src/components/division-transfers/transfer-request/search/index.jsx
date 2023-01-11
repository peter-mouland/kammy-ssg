import React, { useState } from 'react';
import Select from 'react-select';
import bemHelper from '@kammy/bem';

import createFilteredPlayers from '../../lib/create-filtered-players';
import Spacer from '../../../spacer';
import Players from '../components/Players';

const bem = bemHelper({ block: 'transfers-page' });

const createFilterOptions = ({ managers = [], manager }) => [
    {
        label: 'Managers',
        options: [
            { value: 'available', label: 'No manager (free agents)', group: 'manager' },
            ...managers.map((mngr) => ({
                value: mngr,
                label: `${mngr}${mngr === manager ? '*' : ''}`,
                group: 'manager',
            })),
        ],
    },
    {
        label: 'Positions',
        options: [
            { value: 'GK', label: 'GK', group: 'position' },
            { value: 'CB', label: 'CB', group: 'position' },
            { value: 'FB', label: 'FB', group: 'position' },
            { value: 'MID', label: 'MID', group: 'position' },
            { value: 'AM', label: 'AM', group: 'position' },
            { value: 'STR', label: 'STR', group: 'position' },
        ],
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

const Search = ({ managers, manager, teams, searchText, playersArray, defaultFilter, onSelect, transfers }) => {
    const filterOptions = createFilterOptions({ managers, manager, players: playersArray });
    const [playerFilter, setPlayerFilter] = useState(defaultFilter);
    const filteredPlayers = createFilteredPlayers({
        selectedOptions: playerFilter,
        playersArray,
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
                {playersArray.length > 0 && <Players onSelect={onSelect} playersArray={filteredPlayers} />}
            </div>
        </Spacer>
    );
};

export default Search;
