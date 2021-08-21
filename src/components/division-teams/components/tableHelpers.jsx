import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

export const StatsHeaders = ({ colspan }) => (
    <Fragment>
        <th className="cell cell--points" colSpan={colspan}>
            Points
        </th>
        <th className="cell cell--apps show-450" colSpan={colspan}>
            Mins
        </th>
        <th className="cell cell--gls" colSpan={colspan}>
            Gls
        </th>
        <th className="cell cell--asts" colSpan={colspan}>
            Asts
        </th>
        <th className="cell cell--cs show-550" colSpan={colspan}>
            Cs
        </th>
        <th className="cell cell--con" colSpan={colspan}>
            Con
        </th>
        <th className="cell cell--pensv show-550" colSpan={colspan}>
            Pen-svd
        </th>
        <th className="cell cell--ycard show-625" colSpan={colspan}>
            Y card
        </th>
        <th className="cell cell--rcard show-625" colSpan={colspan}>
            R card
        </th>
        <th className="cell cell--rcard hide-625" colSpan={colspan}>
            Cards
        </th>
        <th className="cell cell--sb show-625" colSpan={colspan}>
            Sb
        </th>
        <th className="cell cell--bp show-625" colSpan={colspan}>
            bp
        </th>
        <th className="cell cell--sb hide-625" colSpan={colspan}>
            b
        </th>
    </Fragment>
);

StatsHeaders.propTypes = {
    colspan: PropTypes.number,
};

StatsHeaders.defaultProps = {
    colspan: 2,
};

export const TeamName = ({ team = '' }) => (
    <span>
        <span className="show-550">{team}</span>
        <span className="hide-550">
            {team.split(' ')[0]} {(team.split(' ')[1] || '').charAt(0)}
        </span>
    </span>
);

export const StatsCells = ({ seasonToGameWeek, gameWeekStats, livePoints }) => {
    const isLive = livePoints && livePoints.points;
    const additional = livePoints && livePoints.points ? livePoints : gameWeekStats;
    const pairClass = isLive ? `cell--pair cell--live` : 'cell--pair';

    return (
        <Fragment>
            {seasonToGameWeek && <td className="cell cell--points">{seasonToGameWeek.points}</td>}
            {additional && <td className={`cell ${pairClass} cell--points`}>{additional.points}</td>}
            {seasonToGameWeek && <td className="cell cell--apps show-450">{seasonToGameWeek.apps ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--apps show-450`}>{additional.apps}</td>}
            {seasonToGameWeek && <td className="cell cell--gls">{seasonToGameWeek.gls ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--gls`}>{additional.gls}</td>}
            {seasonToGameWeek && <td className="cell cell--asts">{seasonToGameWeek.asts ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--asts`}>{additional.asts}</td>}
            {seasonToGameWeek && <td className="cell cell--cs show-550">{seasonToGameWeek.cs ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--cs show-550`}>{additional.cs}</td>}
            {seasonToGameWeek && <td className="cell cell--con">{seasonToGameWeek.con ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--con`}>{additional.con}</td>}
            {seasonToGameWeek && <td className="cell cell--pensv show-550">{seasonToGameWeek.pensv ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--pensv show-550`}>{additional.pensv}</td>}
            {seasonToGameWeek && <td className="cell cell--ycard show-625">{seasonToGameWeek.ycard}</td>}
            {additional && <td className={`cell ${pairClass} cell--ycard show-625`}>{additional.ycard}</td>}
            {seasonToGameWeek && <td className="cell cell--rcard show-625">{seasonToGameWeek.rcard}</td>}
            {additional && <td className={`cell ${pairClass} cell--rcard show-625`}>{additional.rcard}</td>}
            {seasonToGameWeek ? (
                <td className="cell cell--card hide-625">{seasonToGameWeek.ycard + seasonToGameWeek.rcard}</td>
            ) : null}
            {additional ? (
                <td className={`cell ${pairClass} cell--card hide-625`}>{additional.ycard + additional.rcard}</td>
            ) : null}
            {seasonToGameWeek && <td className="cell cell--sb show-625">{seasonToGameWeek.sb ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--sb show-625`}>{additional.sb}</td>}
            {seasonToGameWeek && <td className="cell cell--bp show-625">{seasonToGameWeek.bp ?? '-'}</td>}
            {additional && <td className={`cell ${pairClass} cell--bp show-625`}>{additional.bp}</td>}
            {seasonToGameWeek ? (
                <td className="cell cell--sb hide-625">
                    {seasonToGameWeek.sb === null && seasonToGameWeek.bp === null
                        ? '-'
                        : seasonToGameWeek.sb + seasonToGameWeek.bp}
                </td>
            ) : null}
            {additional ? (
                <td className={`cell ${pairClass} cell--sb hide-625`}>
                    {additional.sb === null && additional.bp === null ? '' : additional.sb + additional.bp}
                </td>
            ) : null}
        </Fragment>
    );
};

StatsCells.propTypes = {
    seasonToGameWeek: PropTypes.object,
    gameWeekStats: PropTypes.object,
    livePoints: PropTypes.object,
};

StatsCells.defaultProps = {
    seasonToGameWeek: null,
    gameWeekStats: null,
    livePoints: null,
};
