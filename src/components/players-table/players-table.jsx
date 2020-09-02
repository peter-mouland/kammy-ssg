import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import sortColumns from '@kammy/sort-columns';

import SortIcon from './sort.svg';
import SortDownIcon from './sort-down.svg';
import SortUpIcon from './sort-up.svg';
import New from './new.svg';

const bem = bemHelper({ block: 'table' });

const isSortUp = (sort, id) => sort.includes(id);
const isSortDown = (sort, id) => sort.includes(`-${id}`);
const isNotSorted = (sort, id) => !isSortUp(sort, id) && !isSortDown(sort, id);

const SortableHeader = ({ id, label, sort, handleSort, className = '', ...attrs }) => (
    <th className={`cell cell--${id} ${className}`} {...attrs}>
        <a className={bem('sort-link')} onClick={() => handleSort(id)}>
            {isSortUp(sort, id) && <SortUpIcon className={bem('sort-icon', 'selected')} />}
            {isSortDown(sort, id) && <SortDownIcon className={bem('sort-icon', 'selected')} />}
            {isNotSorted(sort, id) && <SortIcon className={bem('sort-icon')} />}
            <span className={bem('label')}>{label}</span>
        </a>
    </th>
);

SortableHeader.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sort: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleSort: PropTypes.func.isRequired,
    className: PropTypes.string,
};

class PlayerTable extends React.Component {
    state = {
        sort: [],
    };

    handleSort = (column) => {
        const { sort } = this.state;
        switch (true) {
            case isSortUp(sort, column):
                return this.setState({ sort: [`-${column}`] });
            case isSortDown(sort, column):
                return this.setState({ sort: [] });
            case isNotSorted(sort, column):
            default:
                return this.setState({ sort: [column] });
        }
    };

    render() {
        const {
            players,
            visibleStats,
            additionalColumns,
            hiddenColumns,
            myTeam,
            positions,
            disabledPlayers,
        } = this.props;
        const { sort } = this.state;
        return (
            <table className="table">
                <thead>
                    <tr className="row row--header">
                        {!hiddenColumns.includes('isHidden') && <th className="cell cell--hidden">isHidden</th>}
                        {!hiddenColumns.includes('new') && <th className="cell cell--new">New</th>}
                        {!hiddenColumns.includes('code') && <th className="cell cell--code">Code</th>}
                        <SortableHeader id="pos" label="Pos" sort={sort} handleSort={this.handleSort} />
                        <SortableHeader id="name" label="Player" sort={sort} handleSort={this.handleSort} />
                        <SortableHeader id="club" label="Club" sort={sort} handleSort={this.handleSort} />
                        {!hiddenColumns.includes('value') && (
                            <SortableHeader id="value" label="Value" sort={sort} handleSort={this.handleSort} />
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
                                sort={sort}
                                handleSort={this.handleSort}
                                className="cell--stat"
                                colSpan={2}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {players.sort(sortColumns(sort.concat(['pos', 'name']), { pos: positions })).map((player) => {
                        const isOnMyTeam = myTeam && myTeam[player.code];
                        return (
                            <tr
                                key={player.name}
                                id={player.code}
                                className={bem(
                                    'player',
                                    {
                                        selected: isOnMyTeam,
                                        new: !!player.new,
                                        disabled: !!disabledPlayers[player.name],
                                    },
                                    'row',
                                )}
                            >
                                {!hiddenColumns.includes('isHidden') && (
                                    <td className="cell">{player.isHidden && 'hidden'}</td>
                                )}
                                {!hiddenColumns.includes('new') && (
                                    <td className="cell">
                                        {player.new && <New className={bem('new-icon')} />}
                                        {player.new && <span className="sr-only">new</span>}
                                    </td>
                                )}
                                {!hiddenColumns.includes('code') && <td className="cell">{player.code}</td>}
                                <td className="cell">{player.pos}</td>
                                <td className="cell">
                                    <a href="#">{player.name}</a>
                                </td>
                                <td className="cell">
                                    <small>{player.club}</small>
                                </td>
                                {!hiddenColumns.includes('value') && <td className="cell">{player.value}</td>}
                                {additionalColumns.map((col) => (
                                    <td key={col} className={bem('stat', null, 'cell')}>
                                        {String(player[col])}
                                    </td>
                                ))}
                                {visibleStats.map((stat) => (
                                    <Fragment key={stat}>
                                        <td key={stat} className={bem('stat', null, 'cell')}>
                                            {player.season && player.season[stat]}
                                        </td>
                                        <td className={`cell cell--pair cell--${stat}`}>
                                            {player.gameWeek && player.gameWeek[stat]}
                                        </td>
                                    </Fragment>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}

PlayerTable.propTypes = {
    players: PropTypes.array.isRequired,
    positions: PropTypes.array.isRequired,
    visibleStats: PropTypes.array,
    hiddenColumns: PropTypes.arrayOf(PropTypes.string),
    disabledPlayers: PropTypes.object,
    additionalColumns: PropTypes.arrayOf(PropTypes.string),
    myTeam: PropTypes.object,
};

PlayerTable.defaultProps = {
    myTeam: null,
    hiddenColumns: [],
    disabledPlayers: {},
    visibleStats: [],
    additionalColumns: [],
};

export default PlayerTable;
