import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Link } from 'gatsby';

import { useElements } from '../../hooks/use-fpl';
import PlayerImage from '../player-image';
import * as styles from './styles.module.css';

export const Name = ({ children }) => <div className={styles.name}>{children}</div>;
export const Club = ({ children }) => <div className={styles.club}>{children}</div>;
export const Pos = ({ squadPositionId, positionId }) => (
    <div className={styles.pos}>
        <div className={styles.squadPosition}>{squadPositionId || positionId}</div>
        <div className={cx(styles.pos, { [styles.hidden]: positionId === squadPositionId || !squadPositionId })}>
            ({positionId})
        </div>
    </div>
);
export const News = ({ children }) => <div className={styles.news}>{children}</div>;
export const Image = PlayerImage;

export const AllInfo = ({ large, small, player = {} }) => {
    const query = useElements(player.code);
    return (
        <div className={cx(styles.player, { [styles.large]: large })}>
            <div className={styles.gridSquadPos}>
                <Pos
                    positionId={player.playerPositionId || player.positionId}
                    squadPositionId={player.squadPositionId}
                />
            </div>
            <div className={styles.gridImage}>
                <Link to={player.url}>
                    <Image code={player.code} liveQuery={query} large={large} small={small} />
                </Link>
            </div>
            <div className={cx(styles.gridName)}>
                <Link to={player.url}>
                    <Name to={player.url}>{player.name}</Name>
                </Link>
            </div>
            <div className={styles.gridClub}>
                <Club>{player.club}</Club>
            </div>
        </div>
    );
};

AllInfo.propTypes = {
    large: PropTypes.bool,
    small: PropTypes.bool,
    player: PropTypes.shape({
        positionId: PropTypes.string, // player
        playerPositionId: PropTypes.string, // squadPlayer
        club: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        url: PropTypes.string,
    }).isRequired,
};

AllInfo.defaultProps = {
    large: false,
    small: false,
};

export default AllInfo;
