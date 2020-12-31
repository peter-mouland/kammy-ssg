/* eslint-disable react/prop-types */
import React from 'react';
import cx from 'classnames';

import Spacer from '../../../spacer';
import Arrow from '../../../icons/arrow-circle-right.svg';
import styles from '../players-to-swap/players-to-swap.module.css';

const PlayersToSwap = ({ selectedPlayers, team, teamsByManager, playersByName }) => {
    const [isShown, setIsShown] = React.useState(false);
    const playersToShow = [];

    return (
        <div className={cx(styles.accordionContainer, styles.disabled, { [styles.expand]: isShown })}>
            <h3>
                <button type="button" onClick={() => setIsShown(!isShown)} className={styles.accordionCta}>
                    <Arrow height={20} width={20} />
                    <span className={styles.titleText}>New Player Transfer</span>
                    <span className={styles.count}>({playersToShow.length})</span>
                </button>
            </h3>
            <Spacer all={{ stack: Spacer.spacings.SMALL }} className={styles.rules}>
                <li>
                    There are <strong>0</strong> new players available
                </li>
            </Spacer>
        </div>
    );
};
export default PlayersToSwap;
