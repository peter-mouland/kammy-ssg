import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import './positionTimeline.css';

const bem = bemHelper({ block: 'position-timeline' });

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

export const TeamName = ({ team = '' }) => <span>{team}</span>;

export const StatsCells = ({ seasonToGameWeek }) => (
    <Fragment>
        <td className="cell cell--points">{seasonToGameWeek.points}</td>
        <td className="cell cell--apps">{seasonToGameWeek.apps ?? '-'}</td>
        <td className="cell cell--gls">{seasonToGameWeek.gls ?? '-'}</td>
        <td className="cell cell--asts">{seasonToGameWeek.asts ?? '-'}</td>
        <td className="cell cell--cs ">{seasonToGameWeek.cs ?? '-'}</td>
        <td className="cell cell--con">{seasonToGameWeek.con ?? '-'}</td>
        <td className="cell cell--pensv ">{seasonToGameWeek.pensv ?? '-'}</td>
        <td className="cell cell--ycard ">{seasonToGameWeek.ycard}</td>
        <td className="cell cell--rcard ">{seasonToGameWeek.rcard}</td>
        <td className="cell cell--sb">{seasonToGameWeek.sb ?? '-'}</td>
        <td className="cell cell--bp">{seasonToGameWeek.bp ?? '-'}</td>
    </Fragment>
);

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

const PositionTimelineTable = ({ gameWeeks, season }) => (
    <table className="table">
        <thead>
            <tr>
                <th className="cell" colSpan={5} />
                <StatsHeaders colspan={1} />
            </tr>
        </thead>
        <tbody>
            {gameWeeks.map((gameWeek, gw) =>
                gameWeek.fixtures.map((fixture, i) => (
                    <tr key={`${fixture.event}`}>
                        <th>{i === 0 && gw}</th>
                        <td>{gameWeek.name}</td>
                        <td
                            className={bem('team', {
                                home: true,
                                'my-team': gameWeek.club === fixture.hTname,
                            })}
                        >
                            <TeamName team={fixture.hTname} />
                            {fixture.hScore}
                        </td>
                        <td>vs</td>
                        <td
                            className={bem('team', {
                                away: true,
                                'my-team': gameWeek.club === fixture.aTname,
                            })}
                        >
                            {fixture.aScore}
                            <TeamName team={fixture.aTname} />
                        </td>
                        <StatsCells seasonToGameWeek={fixture.stats} />
                    </tr>
                )),
            )}
        </tbody>
        {season && (
            <tfoot>
                <tr>
                    <th colSpan={5} />
                    <StatsCells seasonToGameWeek={season} />
                </tr>
            </tfoot>
        )}
    </table>
);

PositionTimelineTable.propTypes = {
    season: PropTypes.object.isRequired,
    gameWeeks: PropTypes.array.isRequired,
};

export default PositionTimelineTable;
