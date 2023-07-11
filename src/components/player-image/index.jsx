import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import ContextualHelp from '../contextual-help';
import * as styles from './styles.module.css';
import InjuredIcon from '../icons/warning.svg';

const holdingImage = 'https://fantasyfootball.skysports.com/assets/img/players/blank-player.png';

export const getCircleClass = (player) => {
    switch (player.chance_of_playing_this_round) {
        case 100:
            return 'high';
        case 75:
            return 'high';
        case 50:
            return 'medium';
        case 25:
            return 'low';
        case 0:
        case null:
            return 'low';
        default:
            return '';
    }
};

export const Availability = ({ player }) => (
    <div>
        {player.availNews ? <p>{player.availNews}</p> : null}
        {!player.isAvailable ? (
            <div>
                Chance of playing:
                {player.chance_of_playing_this_round}%{' '}
                <div>
                    <span style={{ color: 'grey' }}>({player.chance_of_playing_next_round}% next round)</span>
                </div>
            </div>
        ) : null}
    </div>
);
Availability.propTypes = {
    player: PropTypes.shape({
        isAvailable: PropTypes.bool,
        availNews: PropTypes.string,
        chance_of_playing_this_round: PropTypes.number,
        chance_of_playing_next_round: PropTypes.number,
    }).isRequired,
};

const Image = ({ player }) => {
    const circleClass = getCircleClass(player);
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}`;
    return (
        <div className={cx(styles.circle, !player.isAvailable && styles[circleClass])}>
            {player.code > 0 && <img src={img} loading="lazy" alt="" />}
            <img src={holdingImage} alt="" className={styles.placeholder} />
        </div>
    );
};
Image.propTypes = {
    player: PropTypes.shape({
        code: PropTypes.number.isRequired,
        isAvailable: PropTypes.bool,
    }).isRequired,
};

// new
// {player.new && <New className={bem('new-icon')} />}
// {player.new && <span className="sr-only">new</span>}

const PlayerImage = ({ player, large, small, medium }) => (
    <div
        className={cx(styles.playerImage, {
            [styles.large]: large,
            [styles.mediumSize]: medium,
            [styles.small]: small,
        })}
    >
        {player.isAvailable ? (
            <Image player={player} />
        ) : (
            <ContextualHelp
                body={<Availability player={player} />}
                Trigger={
                    <div className={styles.imageContainer}>
                        <Image player={player} />
                        <span
                            style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                            }}
                            className={styles[getCircleClass(player)]}
                        >
                            <InjuredIcon
                                height={large ? 32 : 16}
                                width={large ? 32 : 16}
                                stroke="currentColor"
                                fill="white"
                            />
                        </span>
                    </div>
                }
            />
        )}
    </div>
);

PlayerImage.propTypes = {
    large: PropTypes.bool,
    medium: PropTypes.bool,
    small: PropTypes.bool,
    player: PropTypes.shape({
        isAvailable: PropTypes.bool,
    }).isRequired,
};

PlayerImage.defaultProps = {
    large: false,
    medium: false,
    small: false,
};

export default PlayerImage;
