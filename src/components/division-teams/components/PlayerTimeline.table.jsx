import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import bemHelper from '@kammy/bem';

import { StatsHeaders, StatsCells, TeamName } from './tableHelpers';
import { getCircleClass } from './unavailable-player';
import './positionTimeline.scss';
import styles from '../styles.module.css';
import InjuredIcon from '../../icons/warning.svg';

const bem = bemHelper({ block: 'position-timeline' });

const sum = (total, stats = {}) => {
    Object.keys(stats || {}).forEach((key) => {
        total[key] = (total[key] || 0) + stats[key]; // eslint-disable-line
    });
    return null;
};

const PlayerTimelineTable = ({ player }) => {
    const totals = {};
    const circleClass = getCircleClass(player);
    const img = `https://fantasyfootball.skysports.com/assets/img/players/${player.code}.png`;
    const holdingImage = 'https://fantasyfootball.skysports.com/assets/img/players/blank-player.png';

    return (
        <div>
            <div className={cx(styles.player, styles.large)}>
                {player.pos === player.teamPos ? (
                    <div>{player.pos}</div>
                ) : (
                    <div>
                        {player.teamPos}
                        <div>
                            <small> ({player.pos.toLowerCase()})</small>
                        </div>
                    </div>
                )}
                <div className={cx(styles.playerImage, styles.large)}>
                    <div className={styles.imageContainer}>
                        <div className={cx(styles.circle, !player.isAvailable && styles[circleClass])}>
                            <img src={img} loading="lazy" alt="" />
                            <img src={holdingImage} alt="" />
                        </div>
                        {!player.isAvailable && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                }}
                                className={styles[circleClass]}
                            >
                                <InjuredIcon height={32} width={32} stroke="currentColor" fill="white" />
                            </span>
                        )}
                    </div>
                </div>
                <div className={cx(styles.playerName, styles.large)}>
                    <p>
                        <span className="show-625">{player.name}</span>
                        <span className="hide-625">{player.name.split(',')[0]}</span>
                    </p>
                    <div className={styles.playerClub}>
                        <span className="show-550">{player.club}</span>
                        <span className="hide-550">
                            {player.club.split(' ')[0]} {(player.club.split(' ')[1] || '').charAt(0)}
                        </span>
                    </div>
                </div>
                {!player.isAvailable && (
                    <div>
                        {(player.availReason || player.availStatus) && (
                            <strong>{player.availReason || player.availStatus}</strong>
                        )}
                        {player.availNews && <p className="show-550">{player.availNews}</p>}
                        {player.returnDate && (
                            <p>
                                <strong>est. return: </strong> {player.returnDate}
                            </p>
                        )}
                    </div>
                )}
            </div>

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
