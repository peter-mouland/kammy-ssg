import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';
import { withDefault, useQueryParams, ArrayParam, BooleanParam } from 'use-query-params';
import bemHelper from '@kammy/bem';
import sortColumns from '@kammy/sort-columns';

import SortDownIcon from './sort-down.svg';
import SortUpIcon from './sort-up.svg';
import * as Player from '../player';
import Button from '../button';

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

const PLAYER_LIMIT_MAX = 999;
const PLAYER_LIMIT_DEFAULT = 50;

// create a custom parameter with a default value
const EmptyArrayParam = withDefault(ArrayParam, []);
const PlayerTable = ({ players, Stats, Positions }) => {
    const [queryParam, setQueryParam] = useQueryParams({
        sort: EmptyArrayParam,
        limit: BooleanParam,
    });
    const handleSort = (column) => {
        switch (true) {
            case isSortUp(queryParam.sort, column):
                return setQueryParam({ sort: [`-${column}`] });
            case isSortDown(queryParam.sort, column):
                return setQueryParam({ sort: [] });
            case isNotSorted(queryParam.sort, column):
            default:
                return setQueryParam({ sort: [`${column}`] });
        }
    };
    const handleLimit = () => {
        setQueryParam({ limit: !queryParam.limit });
    };

    return (
        <React.Fragment>
            <table className="table">
                <thead>
                    <tr className="row row--header">
                        <th className="cell cell--pos show-1000">Pos</th>
                        <th className="cell cell--player">Player</th>
                        <th className="cell cell--club show-1000">Club</th>
                        <th className="cell cell--club show-850">Manager</th>
                        <SortableHeader
                            id="form"
                            label="FPL Form"
                            sort={queryParam.sort}
                            handleSort={handleSort}
                            className="cell--stat show-1000"
                        />

                        <SortableHeader
                            id="value_season"
                            label="FPL Value"
                            sort={queryParam.sort}
                            handleSort={handleSort}
                            className="cell--stat show-1000"
                        />
                        {Stats.all.map((stat) => (
                            <SortableHeader
                                key={stat.id}
                                id={`seasonStats.${stat.id}.value`}
                                label={stat.label}
                                sort={queryParam.sort}
                                handleSort={handleSort}
                                className="cell--stat"
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {players
                        .sort(
                            sortColumns(queryParam.sort.concat(['pos', '-seasonStats.points.value']), {
                                pos: Positions.playerPositions.map((pos) => pos.id),
                            }),
                        )
                        .slice(0, queryParam.limit ? PLAYER_LIMIT_MAX : PLAYER_LIMIT_DEFAULT)
                        .map((player) => {
                            const isOnMyTeam = player.manager.managerId === '';
                            return (
                                <tr
                                    key={player.code}
                                    id={player.code}
                                    className={bem(
                                        'player',
                                        {
                                            selected: isOnMyTeam,
                                            new: !!player.new,
                                            disabled: player.manager.managerId,
                                        },
                                        'row',
                                    )}
                                >
                                    <td className="cell hide-1000">
                                        <Player.AllInfo player={player} />
                                    </td>
                                    <td className="cell show-1000">
                                        <Player.Pos position={player.position} />
                                    </td>
                                    <td className="cell show-1000">
                                        <Link to={player.url}>
                                            <Player.Image code={player.code} small liveQuery={{}} />
                                            <Player.Name>{player.name}</Player.Name>
                                        </Link>
                                    </td>
                                    <td className="cell show-1000">
                                        <Player.Club>{player.club}</Player.Club>
                                    </td>
                                    <td className="cell show-850">{player.manager.label}</td>
                                    <td className="cell show-1000">{player.form}</td>
                                    <td className="cell show-1000">{player.value_season}</td>
                                    {Stats.all.map((stat) => (
                                        <td key={stat.id} className={bem('stat', null, 'cell')}>
                                            {player.seasonStats && (player.seasonStats[stat.id].value ?? '-')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                </tbody>
                <tfoot>
                    <tr>
                        <th colSpan={50}>
                            <em>{queryParam.limit ? `Showing all players` : `Showing top 50 players.`}</em>
                            <Button type={Button.types.PRIMARY} onClick={() => handleLimit()}>
                                {queryParam.limit ? `Show 50 players` : `Show all players`}
                            </Button>
                        </th>
                    </tr>
                </tfoot>
            </table>
        </React.Fragment>
    );
};

PlayerTable.propTypes = {
    players: PropTypes.array.isRequired,
    Stats: PropTypes.object,
    Positions: PropTypes.object.isRequired,
};

PlayerTable.defaultProps = {
    Stats: {},
};

export default PlayerTable;
