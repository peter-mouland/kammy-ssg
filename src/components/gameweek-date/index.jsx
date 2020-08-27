import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

import Cup from './trophy.svg';
import './GameWeekDate.scss';

const getDates = ({ start, end }) => {
    try {
        const startMonth = format(parseISO(start), 'MMM');
        const endMonth = format(parseISO(end), 'MMM');
        const startTime = format(parseISO(start), 'HH:mm');
        const endTime = format(parseISO(end), 'HH:mm');
        const startDay = format(parseISO(start), 'Do');
        const endDay = format(parseISO(end), 'Do');

        return {
            startMonth,
            endMonth,
            startTime,
            endTime,
            startDay,
            endDay,
        };
    } catch (e) {
        console.error(e);
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

const Index = ({
    gameWeek, label, showStart, showEnd, showStartTime, showEndTime, calStart, calEnd,
}) => {
    const { start, end, cup } = gameWeek;

    const {
        startMonth,
        endMonth,
        startTime,
        endTime,
        startDay,
        endDay,
    } = getDates({ start, end });
    return (
        <div className={'formatted-gameweek-container'}>
            {label && <div>{label}</div>}
            <div className={'formatted-gameweek-date'}>
                {cup && <Cup className='formatted-gameweek-cup' />}
                {showStart && (
                    <span className='formatted-gameweek-date__calendar'>
                        <span className='formatted-gameweek-date__month'>{startMonth}</span>
                        <span className='formatted-gameweek-date__day'>{calStart || startDay}</span>
                        {/* <span className='formatted-gameweek-date__year'></span> */}
                        <span className='formatted-gameweek-date__time'>{showStartTime && startTime}</span>
                    </span>
                )}
                {showEnd && (
                    <span className='formatted-gameweek-date__calendar'>
                        <span className='formatted-gameweek-date__month'>{endMonth}</span>
                        <span className='formatted-gameweek-date__day'>{calEnd || endDay}</span>
                        {/* <span className='formatted-gameweek-date__year'></span> */}
                        <span className='formatted-gameweek-date__time'>{showEndTime && endTime}</span>
                    </span>
                )}
            </div>
        </div>
    );
};

Index.propTypes = {
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

Index.defaultProps = {
    showStartTime: true,
    showEndTime: true,
    showStart: true,
    showEnd: true,
};

export default Index;
