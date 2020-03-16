import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import Svg from '../svg';
import Cup from './trophy.svg';
import './GameWeekDate.scss';

const Index = ({
    gameWeek, label, showStart, showEnd, showStartTime, showEndTime, calStart, calEnd,
}) => {
    const { start, end, cup } = gameWeek;
    const startMonth = format(start, 'MMM');
    const endMonth = format(end, 'MMM');
    const startTime = format(start, 'HH:mm');
    const endTime = format(end, 'HH:mm');
    const startDay = format(start, 'Do');
    const endDay = format(end, 'Do');
    return (
        <div className={'formatted-gameweek-container'}>
            {label && <div>{label}</div>}
            <div className={'formatted-gameweek-date'}>
                {cup && <Svg className='formatted-gameweek-cup'>{Cup}</Svg>}
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
