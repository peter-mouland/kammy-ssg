import React from 'react';
import PropTypes from 'prop-types';

import { useElements } from '../../../hooks/use-fpl';
import * as Player from '../../player';
import { StatsHeaders, StatsCells, TeamName } from './tableHelpers';
import * as styles from './position-timeline.module.css';

const sum = (total, stats = {}) => {
    Object.keys(stats || {}).forEach((key) => {
        total[key] = (total[key] || 0) + stats[key]; // eslint-disable-line
    });
    return null;
};

const PlayerTimelineTable = ({ player }) => {
    const elementQuery = useElements(player.code);
    const totals = {};
    return (
        <div>
            <div className={styles.player}>
                <div className={styles.gridImage}>
                    <Player.Image player={player} large liveQuery={elementQuery} />
                </div>

                <div className={styles.gridTeamPos}>
                    <Player.Pos pos={player.pos} />
                </div>

                <div className={styles.gridClub}>
                    <Player.Club>{player.club}</Player.Club>
                </div>
                <div className={styles.gridName}>
                    <Player.Name to={player.url}>{player.name}</Player.Name>
                </div>
                <div className={styles.gridNews}>
                    <Player.News>{elementQuery.data?.news}</Player.News>
                </div>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th className="cell" colSpan={3} />
                        <StatsHeaders colspan={1} />
                    </tr>
                </thead>
                <tbody>
                    {(player.gameWeeks || []).map(({ fixtures }) =>
                        (fixtures || []).map((fixture) => (
                            <tr key={`${fixture.event}`}>
                                <td className={styles.home}>
                                    {fixture.is_home || fixture.was_home ? (
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
                                <td className={styles.away}>
                                    <span style={{ color: 'grey' }}>{fixture.aScore}</span>{' '}
                                    {!fixture.is_home && !fixture.was_home ? (
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
