import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import { StatsHeaders, StatsCells, TeamName } from './tableHelpers';
import Player from '../../player';
import './positionTimeline.scss';

const bem = bemHelper({ block: 'position-timeline' });

const sum = (total, stats = {}) => {
    Object.keys(stats || {}).forEach((key) => {
        total[key] = (total[key] || 0) + stats[key]; // eslint-disable-line
    });
    return null;
};

const PlayerTimelineTable = ({ player }) => {
    const totals = {};
    return (
        <div>
            <Player player={player} large />

            <table className="table">
                <thead>
                    <tr>
                        <th className="cell" colSpan={3} />
                        <StatsHeaders colspan={1} />
                    </tr>
                </thead>
                <tbody>
                    {player.gameWeeks.map(({ fixtures }) =>
                        fixtures.map((fixture) => (
                            <tr key={`${fixture.event}`}>
                                <td className={bem('team', { home: true })}>
                                    {player.club === fixture.hTname ? (
                                        <strong>
                                            <TeamName team={fixture.hTname} />
                                        </strong>
                                    ) : (
                                        <TeamName team={fixture.hTname} />
                                    )}{' '}
                                    <span style={{ color: 'grey' }}>{fixture.hScore}</span>
                                </td>
                                <td>
                                    <span style={{ padding: '0 4px' }}>vs</span>
                                </td>
                                <td className={bem('team', { away: true })}>
                                    <span style={{ color: 'grey' }}>{fixture.aScore}</span>{' '}
                                    {player.club === fixture.aTname ? (
                                        <strong>
                                            <TeamName team={fixture.aTname} />
                                        </strong>
                                    ) : (
                                        <TeamName team={fixture.aTname} />
                                    )}{' '}
                                </td>
                                <StatsCells seasonToGameWeek={fixture.stats} />
                                {sum(totals, fixture.stats)}
                            </tr>
                        )),
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <th colSpan={3} />
                        <StatsCells seasonToGameWeek={totals} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

PlayerTimelineTable.propTypes = {
    player: PropTypes.object.isRequired,
};

export default PlayerTimelineTable;
