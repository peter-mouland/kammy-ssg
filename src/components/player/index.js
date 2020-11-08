import React from 'react';
import cx from 'classnames';
import Link from 'gatsby-link';

import PlayerImage, { Availability } from '../player-image';
import styles from './styles.module.css';

const Player = ({ teamPos, large, small, player }) => {
    const { pos, club, name, isAvailable, url } = player;

    const Pos = () =>
        !teamPos || pos === teamPos ? (
            <div>{pos}</div>
        ) : (
            <div>
                {teamPos}
                <div>
                    <small> ({pos.toLowerCase()})</small>
                </div>
            </div>
        );
    const PlayerName = () => (
        <p>
            <span className="show-625">{name}</span>
            <span className="hide-625">{name.split(',')[0]}</span>
        </p>
    );
    const PlayerNameLink = () => (
        <Link to={`/player/${url}`} title={`Show ${teamPos} timeline`}>
            <PlayerName />
        </Link>
    );
    return (
        <div className={cx(styles.player, { [styles.large]: large, [styles.small]: small })}>
            <Pos />
            <PlayerImage player={player} large={large} small={small} />
            <div className={cx(styles.playerName, { [styles.large]: large, [styles.small]: small })}>
                <PlayerNameLink />
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
