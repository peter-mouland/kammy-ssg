import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import Cup from './trophy.svg';
import './GameWeekDate.css';

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

const GameWeekDate = ({ gameWeek, isSelected, isCurrent }) => {
    const { start, end, cup, gameWeek: GW } = gameWeek;
    const { startMonth, startTime, startDay, endMonth, endDay, endTime } = getDates({ start, end });
    return (
        <div className={isCurrent ? `formatted-gameweek-container isSelected` : `formatted-gameweek-container`}>
            <div className="formatted-gameweek-date">
                {cup && <Cup className="formatted-gameweek-cup" />}
                <span className="formatted-gameweek-date__calendar">
                    <span className="formatted-gameweek-date__month">
                        <div style={{ padding: '0.2em' }}>gw{GW}</div>
                    </span>
                    <span className="formatted-gameweek-date__time">
                        <span>
                            {startMonth} {startDay} {startTime}
                        </span>
                        <span style={{ lineHeight: '0.5em', padding: '0.2em' }}>-</span>
                        <span>
                            {endMonth} {endDay} {endTime}
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
};

GameWeekDate.propTypes = {
    isSelected: PropTypes.bool,
    isCurrent: PropTypes.bool,
    gameWeek: PropTypes.shape({
        gameWeek: PropTypes.number,
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
