import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import positions from './lib/positions';

import './division-rankings.scss';

const PlaceHolder = ({ manager }) => (
    <tr className={'row'}>
        <td className='cell cell--manager'><div className='ph--manager'>{manager}</div></td>
        {positions.map((position) => (
            <Fragment key={position.label}>
                <td className={`cell cell--${position.key}`}><div className='ph--position-rank' /></td>
                <td className={`cell cell--pair cell--${position.key}`}><div className='ph--position-score' /></td>
            </Fragment>
        ))}
        <td className={'cell cell--total'} ><div className='ph--total-rank' /></td>
        <td className={'cell cell--pair cell--total'} ><div className='ph--total-score' /></td>
    </tr>
);

PlaceHolder.propTypes = {
    manager: PropTypes.string.isRequired,
};

const DivisionRankingsTable = ({
    points, type, handleRowHover, managers,
}) => (
    <table className={`table ${points.length === 0 && 'table--placeholder'}`}>
        <thead>
            <tr className='row row--header'>
                <th className={'cell cell--team-manager'} />
                {
                    positions.map((position) => (
                        <th
                            key={position.label}
                            colSpan={2}
                            className={'cell cell--team-season'}
                        >
                            {position.label}
                        </th>
                    ))
                }
                <th
                    colSpan={2}
                    className={'cell cell--team-season'}
                >
                    Total
                </th>
            </tr>
        </thead>
        <tbody>
            {points.length > 0
                ? points
                    .sort((managerA, managerB) => managerB.points.total.rank - managerA.points.total.rank)
                    .map(({ managerName, points: pos }) => (
                        <tr key={managerName} className={'row'} onMouseEnter={() => handleRowHover(managerName)} onMouseLeave={() => handleRowHover(managerName)}>
                            <td className='cell cell--manager'>{managerName}</td>
                            {positions.map((position) => {
                                const gradient = `gradient_${parseInt(pos[position.key].rank, 10).toString().replace('.', '-')}`;
                                return (
                                    <Fragment key={position.key}>
                                        <td className={`cell cell--${position.key} ${gradient}`}>
                                            { pos[position.key].rank }
                                        </td>
                                        <td className={`cell cell--pair cell--${position.key} ${gradient}`}>
                                            { pos[position.key][type] }
                                        </td>
                                    </Fragment>
                                );
                            })}
                            <td className={'cell cell--total'}> { pos.total.rank }</td>
                            <td className={'cell cell--pair cell--total'}>{ pos.total[type] }</td>
                        </tr>
                    ))
                : (
                    <Fragment>
                        {managers.map((managerName) => <PlaceHolder key={managerName} manager={managerName}/>)}
                    </Fragment>
                )
            }
        </tbody>
    </table>
);

DivisionRankingsTable.propTypes = {
    handleRowHover: PropTypes.func,
    points: PropTypes.array,
    managers: PropTypes.array,
    type: PropTypes.oneOf(['seasonPoints', 'gameWeekPoints']).isRequired,
};

DivisionRankingsTable.defaultProps = {
    handleRowHover: () => {},
    points: [],
    managers: [],
};

export default DivisionRankingsTable;
