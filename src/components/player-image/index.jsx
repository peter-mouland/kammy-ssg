import * as React from 'react'
import PropTypes from 'prop-types';
import cx from 'classnames';

import * as styles from './styles.module.css';
import InjuredIcon from '../../icons/warning.svg';

const holdingImage = 'https://fantasyfootball.skysports.com/assets/img/players/blank-player.png';

export const getCircleClass = (live, isLoading) => {
    if (isLoading || !live) return 'loading';
    switch (live.chance_of_playing_next_round) {
        case 100:
            return '100';
        case 75:
            return 'high';
        case 50:
            return 'medium';
        case 25:
            return 'low';
        case 0:
            return 'low';
        case null:
        default:
            return '';
    }
};

const PlayerImage = ({ code, large, small, medium, liveQuery }) => {
    const circleClass = getCircleClass(liveQuery.data, liveQuery.isLoading);
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`}`;

    return (
        <div
            className={cx(styles.playerImage, {
                [styles.large]: large,
                [styles.mediumSize]: medium,
                [styles.small]: small,
            })}
        >
            <div className={cx(styles.circle, styles[circleClass])}>
                {code > 0 && <img src={img} loading="lazy" alt="" />}
                <img src={holdingImage} alt="" />
                <span className={cx(styles.icon)}>
                    <InjuredIcon height={large ? 32 : 16} width={large ? 32 : 16} stroke="currentColor" fill="white" />
                </span>
            </div>
        </div>
    );
};

PlayerImage.propTypes = {
    large: PropTypes.bool,
    medium: PropTypes.bool,
    small: PropTypes.bool,
    code: PropTypes.number.isRequired,
};

PlayerImage.defaultProps = {
    large: false,
    medium: false,
    small: false,
};

export default PlayerImage;
