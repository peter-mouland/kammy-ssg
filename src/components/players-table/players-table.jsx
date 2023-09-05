import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import sortColumns from '@kammy/sort-columns';
import { withDefault, useQueryParams, ArrayParam } from 'use-query-params';

import SortDownIcon from './sort-down.svg';
import SortUpIcon from './sort-up.svg';
import Player from '../player';

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
const PlayerTable = ({
    players,
    visibleStats,
    additionalColumns,
    hiddenColumns,
    myTeam,
    positions,
    disabledPlayers,
    liveStatsByCode,
}) => {
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
                return setState({ sort: [column] });
        }
    };
    return (
        <table className="table">
            <thead>
                <tr className="row row--header">
                    {!hiddenColumns.includes('isHidden') && <th className="cell cell--hidden">isHidden</th>}
                    {!hiddenColumns.includes('code') && <th className="cell cell--code">Code</th>}
                    <th className="cell cell--player">Player</th>
                    {!hiddenColumns.includes('value') && (
                        <SortableHeader id="value" label="Value" sort={state.sort} handleSort={handleSort} />
                    )}
                    {additionalColumns.map((col) => (
                        <th key={col} className={`cell cell--${col}`}>
                            {col}
                        </th>
                    ))}
                    {visibleStats.map((stat) => (
                        <SortableHeader
                            id={`season.${stat}`}
                            label={stat}
                            key={stat}
                            sort={state.sort}
                            handleSort={handleSort}
                            className="cell--stat"
                            colSpan={2}
                        />
                    ))}
                </tr>
            </thead>
            <tbody>
                {players.sort(sortColumns(state.sort.concat(['pos', 'name']), { pos: positions })).map((player) => {
                    const isOnMyTeam = myTeam && myTeam[player.code];
                    const livePoints = liveStatsByCode && liveStatsByCode[player.code];
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
                            {!hiddenColumns.includes('isHidden') && (
                                <td className="cell">{player.isHidden && 'hidden'}</td>
                            )}
                            {!hiddenColumns.includes('code') && <td className="cell">{player.code}</td>}
                            <td className="cell">
                                <Player player={player} />
                            </td>
                            {!hiddenColumns.includes('value') && <td className="cell">{player.value}</td>}
                            {additionalColumns.map((col) => (
                                <td key={col} className={bem('stat', null, 'cell')}>
                                    {String(player[col])}
                                </td>
                            ))}
                            {visibleStats.map((stat) => (
                                <Fragment key={stat}>
                                    <td key={state.stat} className={bem('stat', null, 'cell')}>
                                        {player.season && (player.season[stat] ?? '-')}
                                    </td>
                                    <td className={`cell cell--pair cell--${stat}`}>
                                        {player.gameWeek && player.gameWeek[stat]}
                                        <span className="cell--live">{livePoints && livePoints[stat]}</span>
                                    </td>
                                </Fragment>
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
    positions: PropTypes.array.isRequired,
    visibleStats: PropTypes.array,
    hiddenColumns: PropTypes.arrayOf(PropTypes.string),
    disabledPlayers: PropTypes.object,
    additionalColumns: PropTypes.arrayOf(PropTypes.string),
    myTeam: PropTypes.object,
    liveStatsByCode: PropTypes.object,
};

PlayerTable.defaultProps = {
    liveStatsByCode: null,
    myTeam: null,
    hiddenColumns: [],
    disabledPlayers: {},
    visibleStats: [],
    additionalColumns: [],
};

export default PlayerTable;
