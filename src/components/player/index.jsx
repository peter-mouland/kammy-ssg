import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Link } from 'gatsby';

import PlayerImage, { Availability } from '../player-image';
import * as styles from './styles.module.css';

const Player = ({ teamPos, large, small, player = {} }) => {
    const { pos, club = '', name = '', isAvailable, url } = player;

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
        <Link to={url} title={`Show ${teamPos} timeline`}>
            <PlayerName />
        </Link>
    );
    return (
        <div className={cx(styles.player, { [styles.large]: large })}>
            <Pos />
            <PlayerImage player={player} large={large} small={small} />
            <div className={cx(styles.playerName, { [styles.large]: large })}>
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

Player.propTypes = {
    teamPos: PropTypes.string,
    large: PropTypes.bool,
    small: PropTypes.bool,
    player: PropTypes.shape({
        pos: PropTypes.string.isRequired,
        club: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        url: PropTypes.string,
        isAvailable: PropTypes.bool,
        availNews: PropTypes.string,
    }).isRequired,
};

Player.defaultProps = {
    teamPos: '',
    large: false,
    small: false,
};

export default Player;
