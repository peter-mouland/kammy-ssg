import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import sortBy from '@kammy/sort-columns';

import positions from './lib/positions';
import * as styles from './division-rankings.module.css';

const DivisionRankingsTable = ({ points, type, rank }) => (
    <table className={`table ${points.length === 0 && 'table--placeholder'}`}>
        <thead>
            <tr className="row row--header">
                <th className="cell cell--team-manager" />
                {positions.map((position) => (
                    <th key={position.label} colSpan={2} className="cell cell--team-season">
                        {position.label}
                    </th>
                ))}
                <th colSpan={2} className="cell cell--team-season">
                    Total
                </th>
            </tr>
        </thead>
        <tbody>
            {points
                .sort(sortBy([`-points.total.${rank}`, '-points.total.seasonPoints']))
                .map(({ manager, points: pos }) => (
                    <tr key={manager.key} className="row">
                        {/* <td className="cell cell--manager">*/}
                        {/*    <Link to={`/manager/${manager.key}`}>{manager.name}</Link>*/}
                        {/* </td>*/}
                        <td className="cell cell--manager">{manager.name}</td>
                        {positions.map((position) => {
                            const gradient = `gradient_${parseInt(pos[position.key][rank], 10)
                                .toString()
                                .replace('.', '_')
                                .replace('-', '_')}`;
                            return (
                                <Fragment key={position.key}>
                                    <td className={`cell cell--${position.key} ${styles[gradient]}`}>
                                        {pos[position.key][rank]}
                                    </td>
                                    <td className={`cell cell--pair cell--${position.key} ${styles[gradient]}`}>
                                        {pos[position.key][type]}
                                    </td>
                                </Fragment>
                            );
                        })}
                        <td className="cell cell--total"> {pos.total[rank]}</td>
                        <td className="cell cell--pair cell--total">{pos.total[type]}</td>
                    </tr>
                ))}
        </tbody>
    </table>
);

DivisionRankingsTable.propTypes = {
    points: PropTypes.array,
    type: PropTypes.oneOf(['seasonPoints', 'gameWeekPoints']).isRequired,
    rank: PropTypes.oneOf(['rank', 'rankChange']).isRequired,
};

DivisionRankingsTable.defaultProps = {
    points: [],
};

export default DivisionRankingsTable;
