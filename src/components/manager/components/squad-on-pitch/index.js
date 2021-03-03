import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import PitchIcon from '../../../icons/pitch.svg';
import PlayerImage from '../../../player-image';
import * as styles from './manager.module.css';

const Pos = ({ children, isInteractive, onSelect, teamPos, squadMember, posIndex }) =>
    isInteractive ? (
        <button
            type="button"
            className={cx(styles.pos, styles[teamPos.toLowerCase()], {
                [styles.isSelected]: squadMember.isSelected,
                [styles.isChanged]: squadMember.hasChanged,
            })}
            onClick={isInteractive ? () => onSelect({ ...squadMember, posIndex }) : null}
        >
            {children}
        </button>
    ) : (
        <div className={cx(styles.pos, styles[teamPos.toLowerCase()])}>{children}</div>
    );

Pos.propTypes = {
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func.isRequired,
    teamPos: PropTypes.string.isRequired,
    squadMember: PropTypes.object.isRequired,
    posIndex: PropTypes.number.isRequired,
    isInteractive: PropTypes.bool,
};

Pos.defaultProps = {
    isInteractive: false,
};

const SquadOnPitch = ({ squad, onSelect }) => {
    const isInteractive = onSelect !== null;
    const positions = ['GK', 'FB', 'FB', 'CB', 'CB', 'MID', 'MID', 'AM', 'AM', 'STR', 'STR', 'SUB'];
    return (
        <div className={styles.teamContainer}>
            <div className={styles.iconContainer}>
                <PitchIcon width={452} height={684} />
            </div>
            <div className={styles.team}>
                {positions.map((pos, index) => {
                    const squadMember = squad.find((item) => item.posIndex === index);
                    return (
                        <Pos key={index} {...{ squadMember, teamPos: pos, posIndex: index, onSelect, isInteractive }}>
                            <PlayerImage player={{ ...squadMember.player, teamPos: pos }} medium />
                            <div className={styles.meta}>
                                <div className={styles.name}>
                                    <span className={styles.last}>{squadMember.player.name.split(',')[0]}</span>
                                    <span className={styles.first}>{squadMember.player.name.split(',')[1]}</span>
                                </div>
                                <div className={styles.club}>{squadMember.player.club}</div>
                            </div>
                        </Pos>
                    );
                })}
            </div>
        </div>
    );
};

SquadOnPitch.propTypes = {
    squad: PropTypes.array.isRequired,
    onSelect: PropTypes.func,
};

SquadOnPitch.defaultProps = {
    onSelect: null,
};

export default SquadOnPitch;
