import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import './game-week-fixtures.css';
import Spacer from '../spacer';

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
        <div>
            {fixtures &&
                fixtures.map((fixture) => {
                    if (!fixture || !fixture.date) return null;
                    const fullDate = toFullDate(fixture);
                    const dateStr = fullDate === previousFullDate ? null : <h2 title={fixture.date}>{fullDate}</h2>;
                    const { aScore, hScore } = fixture;
                    previousFullDate = fullDate;
                    return (
                        <div key={fixture.id} className={bem('fixtures', 'theme-0')}>
                            {dateStr && (
                                <Spacer all={{ vertical: Spacer.spacings.LARGE, bottom: Spacer.spacings.SMALL }}>
                                    {dateStr}
                                </Spacer>
                            )}
                            <span className={bem('fixture')}>
                                <span className={bem('team', 'home')}>
                                    {fixture.hTname} <span>{hScore}</span>
                                </span>
                                vs
                                <span className={bem('team', 'away')}>
                                    <span>{aScore}</span> {fixture.aTname}
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
            date: PropTypes.string,
            aScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            hScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        }),
    ),
};

GameWeekFixtures.defaultProps = {
    fixtures: [],
};

export default GameWeekFixtures;
