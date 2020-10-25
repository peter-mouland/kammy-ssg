import React from 'react';
import cx from 'classnames';

import PlayerImage, { Availability } from '../player-image';
import styles from './styles.module.css';

const Player = ({ teamPos, large, player, onShowPositionTimeline, onShowPlayerTimeline }) => {
    const { pos, club, seasonStats, name, isAvailable, gameWeeks } = player;

    const Pos = () =>
        !teamPos || (pos === teamPos) ? (
            <div>{pos}</div>
        ) : (
            <div>
                {teamPos}
                <div>
                    <small> ({pos.toLowerCase()})</small>
                </div>
            </div>
        );
    const PosLink = () => (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onShowPositionTimeline({
                    position: pos,
                    gameWeeks,
                    season: seasonStats,
                });
            }}
            title={`Show ${teamPos} timeline`}
            className={styles.playerPosition}
        >
            <Pos />
        </a>
    );
    const PlayerName = () => (
        <p>
            <span className="show-625">{name}</span>
            <span className="hide-625">{name.split(',')[0]}</span>
        </p>
    );
    const PlayerNameLink = () => (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onShowPlayerTimeline({ player });
            }}
            title={`Show ${teamPos} timeline`}
        >
            <PlayerName />
        </a>
    );
    return (
        <div className={cx(styles.player, { [styles.large]: large })}>
            {onShowPositionTimeline ? <PosLink /> : <Pos />}
            <PlayerImage player={player} large={large} />
            <div className={cx(styles.playerName, { [styles.large]: large })}>
                {onShowPlayerTimeline ? <PlayerNameLink /> : <PlayerName />}
                <div className={styles.playerClub}>
                    <span className="show-550">{club}</span>
                    <span className="hide-550">
                        {club.split(' ')[0]} {(club.split(' ')[1] || '').charAt(0)}
                    </span>
                </div>
            </div>
            {large && !isAvailable && <Availability player={player} />}
        </div>
    );
};

export default Player;
