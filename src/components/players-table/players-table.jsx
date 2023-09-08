import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import sortColumns from '@kammy/sort-columns';
import { withDefault, useQueryParams, ArrayParam } from 'use-query-params';

import SortDownIcon from './sort-down.svg';
import SortUpIcon from './sort-up.svg';
import * as Player from '../player';

const bem = bemHelper({ block: 'table' });

const isSortUp = (sort, id) => sort.includes(id);
const isSortDown = (sort, id) => sort.includes(`-${id}`);
const isNotSorted = (sort, id) => !isSortUp(sort, id) && !isSortDown(sort, id);

const SortableHeader = ({ id, label, sort, handleSort, className = '', ...attrs }) => (
    <th className={`cell cell--${id} ${className}`} {...attrs}>
        <button className={bem('sort-link')} onClick={() => handleSort(id)} type="submit">
            {isSortUp(sort, id) && <SortUpIcon className={bem('sort-icon', 'selected')} />}
            {isSortDown(sort, id) && <SortDownIcon className={bem('sort-icon', 'selected')} />}
            <span className={bem('label')}>{label}</span>
        </button>
    </th>
);

SortableHeader.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sort: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleSort: PropTypes.func.isRequired,
    className: PropTypes.string,
};

SortableHeader.defaultProps = {
    className: '',
};

// create a custom parameter with a default value
const EmptyArrayParam = withDefault(ArrayParam, []);
const PlayerTable = ({ players, Stats, myTeam, Positions, disabledPlayers }) => {
    const [state, setState] = useQueryParams({
        sort: EmptyArrayParam,
    });
    const handleSort = (column) => {
        switch (true) {
            case isSortUp(state.sort, column):
                return setState({ sort: [`-${column}`] });
            case isSortDown(state.sort, column):
                return setState({ sort: [] });
            case isNotSorted(state.sort, column):
            default:
                return setState({ sort: [`${column}`] });
        }
    };
    return (
        <table className="table">
            <thead>
                <tr className="row row--header">
                    <th className="cell cell--pos show-1000">Pos</th>
                    <th className="cell cell--player">Player</th>
                    <th className="cell cell--club show-1000">Club</th>
                    {Stats.all.map((stat) => (
                        <SortableHeader
                            key={stat.id}
                            id={`season.${stat.id}.value`}
                            label={stat.label}
                            sort={state.sort}
                            handleSort={handleSort}
                            className="cell--stat"
                        />
                    ))}
                </tr>
            </thead>
            <tbody>
                {players
                    .sort(
                        sortColumns(state.sort.concat(['pos', 'name']), {
                            pos: Positions.PlayerPositions.map((pos) => pos.id),
                        }),
                    )
                    .map((player) => {
                        const isOnMyTeam = myTeam && myTeam[player.code];
                        return (
                            <tr
                                key={player.code}
                                id={player.code}
                                className={bem(
                                    'player',
                                    {
                                        selected: isOnMyTeam,
                                        new: !!player.new,
                                        disabled: !!disabledPlayers[player.code],
                                    },
                                    'row',
                                )}
                            >
                                <td className="cell hide-1000">
                                    <Player.AllInfo SquadPlayer={player} />
                                </td>
                                <td className="cell show-1000">
                                    <Player.Pos position={player.positionId} />
                                </td>
                                <td className="cell show-1000">
                                    <Player.Image code={player.code} small liveQuery={{}} />
                                    <Player.Name>{player.name}</Player.Name>
                                </td>
                                <td className="cell show-1000">
                                    <Player.Club>{player.club}</Player.Club>
                                </td>
                                {Stats.all.map((stat) => (
                                    <td key={stat.id} className={bem('stat', null, 'cell')}>
                                        {player.season && (player.season[stat.id].value ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );
};

PlayerTable.propTypes = {
    players: PropTypes.array.isRequired,
    Stats: PropTypes.object,
    Positions: PropTypes.object.isRequired,
    disabledPlayers: PropTypes.object,
    myTeam: PropTypes.object,
};

PlayerTable.defaultProps = {
    myTeam: null,
    disabledPlayers: {},
    Stats: {},
};

export default PlayerTable;
