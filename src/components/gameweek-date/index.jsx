import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import cx from 'classnames';

import Cup from './trophy.svg';
import * as styles from './gameweek-date.module.css';

const getDates = ({ start, end }) => {
    try {
        return {
            startMonth: format(start, 'MMM'),
            endMonth: format(end, 'MMM'),
            startTime: format(start, 'HH:mm'),
            endTime: format(end, 'HH:mm'),
            startDay: format(start, 'do'),
            endDay: format(end, 'do'),
        };
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        // eslint-disable-next-line no-console
        console.error({ start, end });
        return {
            startMonth: '',
            endMonth: '',
            startTime: '',
            endTime: '',
            startDay: '',
            endDay: '',
        };
    }
};

const GameWeekDate = ({ gameWeek, isSelected }) => {
    const { startMonth, startTime, startDay, endMonth, endDay, endTime } = getDates(gameWeek);
    return (
        <div
            className={cx(styles.container, {
                [styles.isSelected]: gameWeek.isSelected,
                [styles.isCurrent]: gameWeek.isCurrent,
            })}
        >
            {gameWeek.cup && <Cup className={styles.cup} />}
            <span className={styles.gw}>
                {/* Another div to separate 'height-fill' from 'vertical-aligned' copy*/}
                <div className={styles.va}>gw{gameWeek.id}</div>
            </span>
            <span className={styles.time}>
                {gameWeek.isCurrent ? (
                    <React.Fragment>
                        Ends <strong>{gameWeek.endFromNow}</strong>
                    </React.Fragment>
                ) : gameWeek.hasPassed ? (
                    <React.Fragment>
                        Ended{' '}
                        <strong>
                            {endMonth} {endDay} {endTime}
                        </strong>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        Starts{' '}
                        <strong>
                            {startMonth} {startDay} {startTime}
                        </strong>
                    </React.Fragment>
                )}
            </span>
        </div>
    );
};

GameWeekDate.propTypes = {
    isSelected: PropTypes.bool,
    isCurrent: PropTypes.bool,
    gameWeek: PropTypes.shape({
        id: PropTypes.number,
        cup: PropTypes.bool,
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date),
    }).isRequired,
};

GameWeekDate.defaultProps = {
    isSelected: false,
    isCurrent: false,
};

export default GameWeekDate;
