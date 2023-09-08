import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Link } from 'gatsby';

import { useElements } from '../../hooks/use-fpl';
import PlayerImage from '../player-image';
import * as styles from './styles.module.css';

export const Name = ({ children }) => <div className={styles.name}>{children}</div>;
export const Club = ({ children }) => <div className={styles.club}>{children}</div>;
export const Pos = ({ squadPosition, position }) => (
    <div className={styles.pos}>
        <div className={styles.teamPos}>{squadPosition || position}</div>
        <div className={cx(styles.pos, { [styles.hidden]: position === squadPosition || !squadPosition })}>
            ({position})
        </div>
    </div>
);
export const News = ({ children }) => <div className={styles.news}>{children}</div>;
export const Image = PlayerImage;

export const AllInfo = ({ large, small, SquadPlayer = {} }) => {
    const query = useElements(SquadPlayer.code);
    return (
        <div className={cx(styles.player, { [styles.large]: large })}>
            <div className={styles.gridTeamPos}>
                <Pos position={SquadPlayer.positionId} squadPosition={SquadPlayer.squadPositionId} />
            </div>
            <div className={styles.gridImage}>
                <Link to={SquadPlayer.url}>
                    <Image code={SquadPlayer.code} liveQuery={query} large={large} small={small} />
                </Link>
            </div>
            <div className={cx(styles.gridName)}>
                <Link to={SquadPlayer.url}>
                    <Name to={SquadPlayer.url}>{SquadPlayer.name}</Name>
                </Link>
            </div>
            <div className={styles.gridClub}>
                <Club>{SquadPlayer.club}</Club>
            </div>
        </div>
    );
};

AllInfo.propTypes = {
    large: PropTypes.bool,
    small: PropTypes.bool,
    SquadPlayer: PropTypes.shape({
        positionId: PropTypes.string.isRequired,
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
