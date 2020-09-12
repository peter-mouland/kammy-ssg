import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import Cup from './trophy.svg';
import './GameWeekDate.scss';

const getDates = ({ start, end }) => {
    console.log({ start, end })
    try {
        return {
            startMonth: format(start, 'MMM'),
            endMonth: format(end, 'MMM'),
            startTime: format(start, 'HH:mm'),
            endTime: format(end, 'HH:mm'),
            startDay: format(start, 'd'),
            endDay: format(end, 'd'),
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

const GameWeekDate = ({ gameWeek, label, showStart, showEnd, showStartTime, showEndTime, calStart, calEnd }) => {
    console.log({gameWeek})
    const { start, end, cup } = gameWeek;

    const { startMonth, endMonth, startTime, endTime, startDay, endDay } = getDates({
        start,
        end,
    });
    return (
        <div className="formatted-gameweek-container">
            {label && <div>{label}</div>}
            <div className="formatted-gameweek-date">
                {cup && <Cup className="formatted-gameweek-cup" />}
                {showStart && (
                    <span className="formatted-gameweek-date__calendar">
                        <span className="formatted-gameweek-date__month">{startMonth}</span>
                        <span className="formatted-gameweek-date__day">{calStart || startDay}</span>
                        {/* <span className='formatted-gameweek-date__year'></span> */}
                        <span className="formatted-gameweek-date__time">{showStartTime && startTime}</span>
                    </span>
                )}
                {showEnd && (
                    <span className="formatted-gameweek-date__calendar">
                        <span className="formatted-gameweek-date__month">{endMonth}</span>
                        <span className="formatted-gameweek-date__day">{calEnd || endDay}</span>
                        {/* <span className='formatted-gameweek-date__year'></span> */}
                        <span className="formatted-gameweek-date__time">{showEndTime && endTime}</span>
                    </span>
                )}
            </div>
        </div>
    );
};

GameWeekDate.propTypes = {
    showEndTime: PropTypes.bool,
    showStartTime: PropTypes.bool,
    showStart: PropTypes.bool,
    showEnd: PropTypes.bool,
    label: PropTypes.string,
    calStart: PropTypes.string,
    calEnd: PropTypes.string,
    gameWeek: PropTypes.shape({
        cup: PropTypes.bool,
        start: PropTypes.string,
        end: PropTypes.string,
    }).isRequired,
};

GameWeekDate.defaultProps = {
    showStartTime: true,
    showEndTime: true,
    showStart: true,
    showEnd: true,
    label: '',
    calStart: '',
    calEnd: '',
};

export default GameWeekDate;
