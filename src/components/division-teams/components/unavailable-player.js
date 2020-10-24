import React from 'react';
import cx from 'classnames';

import ContextualHelp from '../../contextual-help';
import styles from '../styles.module.css';
import InjuredIcon from '../../icons/warning.svg';

const holdingImage = 'https://fantasyfootball.skysports.com/assets/img/players/blank-player.png';

export const getCircleClass = (player) => {
    switch (player.availStatus) {
        case 'Available':
            return 'high';
        case 'Doubt 75%':
            return 'high';
        case 'Doubt 50%':
            return 'medium';
        case 'Doubt 25%':
            return 'low';
        case 'Suspended':
            return 'low';
        case 'Injured':
            return 'low';
        default:
            return '';
    }
};

const UnavailablePlayer = ({ player }) => {
    const circleClass = getCircleClass(player);
    const img = `https://fantasyfootball.skysports.com/assets/img/players/${player.code}.png`;
    return (
        <ContextualHelp
            body={
                <div>
                    {(player.availReason || player.availStatus) && (
                        <strong>{player.availReason || player.availStatus}</strong>
                    )}
                    {player.availNews && <p>{player.availNews}</p>}
                    {player.returnDate && (
                        <p>
                            <strong>est-return: </strong> {player.returnDate}
                        </p>
                    )}
                </div>
            }
            Trigger={
                <div className={styles.imageContainer}>
                    <div className={cx(styles.circle, styles[circleClass])}>
                        <img src={img} loading="lazy" alt="" />
                        <img src={holdingImage} alt="" />
                    </div>
                    <span
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                        }}
                        className={styles[circleClass]}
                    >
                        <InjuredIcon height={16} width={16} stroke="currentColor" fill="white" />
                    </span>
                </div>
            }
        />
    );
};

export default UnavailablePlayer;
