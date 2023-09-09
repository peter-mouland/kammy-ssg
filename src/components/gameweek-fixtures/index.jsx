import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import './game-week-fixtures.css';

const bem = bemHelper({ block: 'club-fixtures' });
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const toDate = (string = '') => (!string ? string : new Date(string));
const toFullDate = (fixture) => {
    const date = toDate(fixture.date);
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

const GameWeekFixtures = ({ fixtures }) => {
    let previousFullDate = '';
    return (
        <div style={{ fontSize: '0.8em', position: 'relative' }}>
            {fixtures &&
                fixtures.map((fixture) => {
                    if (!fixture || !fixture.date) return null;
                    const fullDate = toFullDate(fixture);
                    const dateStr =
                        fullDate === previousFullDate ? null : <h2 style={{ position: 'absolute' }}>{fullDate}</h2>;
                    previousFullDate = fullDate;
                    return (
                        <div key={fixture.id} className={bem('fixtures')}>
                            {dateStr}
                            <span className={bem('fixture')}>
                                <span className={bem('team', 'home')}>
                                    {fixture.homeTeam.name} <span>{fixture.team_h_score}</span>
                                </span>
                                vs
                                <span className={bem('team', 'away')}>
                                    <span>{fixture.team_a_score}</span> {fixture.awayTeam.name}
                                </span>
                            </span>
                        </div>
                    );
                })}
        </div>
    );
};

GameWeekFixtures.propTypes = {
    fixtures: PropTypes.arrayOf(
        PropTypes.shape({
            hTname: PropTypes.string,
            aTname: PropTypes.string,
            date: PropTypes.any, // date
            aScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            hScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        }),
    ),
};

GameWeekFixtures.defaultProps = {
    fixtures: [],
};

export default GameWeekFixtures;
