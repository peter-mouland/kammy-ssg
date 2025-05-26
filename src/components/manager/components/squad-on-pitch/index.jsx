/* eslint-disable no-console */
import * as React from 'react'
import PropTypes from 'prop-types';
import cx from 'classnames';

import PitchIcon from '../../../../icons/pitch.svg';
import PlayerImage from '../../../player-image';
import * as styles from './manager.module.css';

const Pos = ({ children, isInteractive, onSelect, squadPositionId, squadMember, squadPositionIndex }) =>
    isInteractive ? (
        <button
            type="button"
            className={cx(styles.pos, styles[squadPositionId], {
                [styles.isSelected]: squadMember.isSelected,
                [styles.isChanged]: squadMember.hasChanged,
            })}
            onClick={isInteractive ? () => onSelect({ ...squadMember, squadPositionIndex }) : null}
        >
            {children}
        </button>
    ) : (
        <div className={cx(styles.pos, styles[squadPositionId])}>{children}</div>
    );

Pos.propTypes = {
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func.isRequired,
    squadPositionId: PropTypes.string.isRequired,
    squadMember: PropTypes.object.isRequired,
    squadPositionIndex: PropTypes.number.isRequired,
    isInteractive: PropTypes.bool,
};

Pos.defaultProps = {
    isInteractive: false,
};

const positions = ['GK', 'FB', 'FB', 'CB', 'CB', 'MID', 'MID', 'WA', 'WA', 'CA', 'CA', 'SUB'];

const SquadOnPitch = ({ squad, onSelect }) => {
    const isInteractive = onSelect !== null;
    return (
        <div className={styles.teamContainer}>
            <div className={styles.iconContainer}>
                <PitchIcon width={452} height={684} />
            </div>
            <div className={styles.team}>
                {positions.map((pos, index) => {
                    const squadMember = squad.players.find((item) => item.squadPositionIndex === index);
                    if (!squadMember) {
                        console.log('squadMember player not found');
                        console.log('This likely means gsheets does not match FPL spelling');
                        console.log(squadMember);
                        return null;
                    }
                    return (
                        <Pos
                            key={index}
                            {...{
                                squadMember,
                                squadPositionId: pos.toLowerCase(),
                                squadPositionIndex: index,
                                onSelect,
                                isInteractive,
                            }}
                        >
                            <PlayerImage code={squadMember.code} medium liveQuery={{}} />
                            <div className={styles.meta}>
                                <div className={styles.name}>
                                    <span>{squadMember.name.split(',')[0]}</span>
                                    <span className={styles.first}>{squadMember.name.split(',')[1]}</span>
                                </div>
                                <div className={styles.club}>{squadMember.club}</div>
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
