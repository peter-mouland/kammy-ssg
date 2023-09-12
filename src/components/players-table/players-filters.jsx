/* eslint-disable react/no-deprecated */
import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import Select from 'react-select';
import { useQueryParams, ArrayParam } from 'use-query-params';

import './players-filters.css';

const bem = bemHelper({ block: 'players-filters' });
// create a custom parameter with a default value

const applyFilters = ({ player, queryParams }) => {
    const playerFiltered = !queryParams.player?.length || queryParams.player.includes(player.name);
    const posFiltered = !queryParams.pos?.length || queryParams.pos.includes(player.positionId.toLowerCase()); // todo: use posid in db
    const miscFiltered = !queryParams.misc?.length || (queryParams.misc.includes('isNew') && player.new);
    const clubFiltered = !queryParams.club?.length || queryParams.club.includes(player.club);
    const managerFiltered = !queryParams.manager?.length || queryParams.manager.includes(player.manager.managerId);
    return playerFiltered && posFiltered && clubFiltered && miscFiltered && managerFiltered;
};

const addFilter = (selectedFilters, setQueryParams) => {
    const pos = [];
    const club = [];
    const player = [];
    const manager = [];
    const misc = [];

    (selectedFilters || []).forEach(({ group, value }) => {
        if (group === 'position') pos.push(value);
        if (group === 'club') club.push(value);
        if (group === 'player') player.push(value);
        if (group === 'manager') manager.push(value);
        if (group === 'misc') misc.push(value);
    });
    setQueryParams({
        misc: Array.from(new Set(misc)),
        pos: Array.from(new Set(pos)),
        club: Array.from(new Set(club)),
        player: Array.from(new Set(player)),
        manager: Array.from(new Set(manager)),
    });
};

const queryToFilter = (queryParams, options) => {
    const selectedFilters = [];
    if (queryParams.misc) {
        const group = options.find((option) => option.param === 'misc');
        const groupOptions = group.options.filter((option) => queryParams.misc.includes(option.value));
        selectedFilters.push(...groupOptions);
    }
    if (queryParams.pos) {
        const group = options.find((option) => option.param === 'pos');
        const groupOptions = group.options.filter((option) => queryParams.pos.includes(option.value));
        selectedFilters.push(...groupOptions);
    }
    if (queryParams.player) {
        const group = options.find((option) => option.param === 'player');
        const groupOptions = group.options.filter((option) => queryParams.player.includes(option.value));
        selectedFilters.push(...groupOptions);
    }
    if (queryParams.club) {
        const group = options.find((option) => option.param === 'club');
        const groupOptions = group.options.filter((option) => queryParams.club.includes(option.value));
        selectedFilters.push(...groupOptions);
    }
    if (queryParams.manager) {
        const group = options.find((option) => option.param === 'manager');
        const groupOptions = group.options.filter((option) => queryParams.manager.includes(option.value));
        selectedFilters.push(...groupOptions);
    }
    return selectedFilters;
};

const getOptions = ({ positions, clubs, players, managers }) => [
    {
        label: 'Misc',
        param: 'misc',
        options: [{ value: 'isNew', label: 'New Players', group: 'misc' }],
    },
    {
        label: 'Positions',
        param: 'pos',
        options: positions.playerPositions.map((position) => ({
            value: position.id,
            label: position.label,
            group: 'position',
        })),
    },
    {
        label: 'Clubs',
        param: 'club',
        options: clubs.map((club) => ({ value: club, label: club, group: 'club' })),
    },
    {
        label: 'Managers',
        param: 'manager',
        options: managers.map((manager) => ({ value: manager.id, label: manager.label, group: 'manager' })),
    },
    {
        label: 'Players',
        param: 'player',
        options: players.map(({ name }) => ({
            value: name,
            label: name,
            group: 'player',
        })),
    },
];

export default function PlayersFilters({ positions, players, clubs, managers, children }) {
    const [queryParams, setQueryParams] = useQueryParams({
        pos: ArrayParam,
        player: ArrayParam,
        club: ArrayParam,
        manager: ArrayParam,
        misc: ArrayParam,
    });
    const options = getOptions({ positions, clubs, players, managers });
    const selectedFilterValue = queryToFilter(queryParams, options);
    const onFilter = () =>
        players.filter((player) =>
            applyFilters({
                player,
                queryParams,
            }),
        );

    return (
        <div className={bem()}>
            <div className={bem('filters')}>
                <div className={bem('group')}>
                    <div>
                        <Select
                            placeholder="filter..."
                            value={selectedFilterValue}
                            options={options}
                            isMulti
                            name="playersFiltersOut"
                            onChange={(selectedFilters) => addFilter(selectedFilters, setQueryParams)}
                        />
                    </div>
                </div>
            </div>
            <div className={bem('contents')}>{children(onFilter())}</div>
        </div>
    );
}

PlayersFilters.propTypes = {
    players: PropTypes.array.isRequired,
    positions: PropTypes.object.isRequired,
    children: PropTypes.func.isRequired,
};
