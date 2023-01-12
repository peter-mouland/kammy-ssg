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

const GameWeekFixtures = ({ fixtures }) => {
    let previousFullDate = '';
    let theme = 1;
    return (
        <div>
            {fixtures &&
                fixtures.map((fixture) => {
                    if (!fixture || !fixture.date) return;
                    const date = toDate(fixture.date);
                    const fullDate = `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`;
                    const dateStr = fullDate === previousFullDate ? null : <h2 title={fixture.date}>{fullDate}</h2>;
                    const { aScore } = fixture;
                    const { hScore } = fixture;
                    const aScoreClass = bem();
                    const hScoreClass = bem();
                    previousFullDate = fullDate;
                    if (dateStr) theme = 1 - theme;
                    const themeClass = `theme-${theme}`;
                    return (
                        <div key={fixture.id} className={bem('fixtures', themeClass)}>
                            {dateStr && (
                                <Spacer all={{ vertical: Spacer.spacings.LARGE, bottom: Spacer.spacings.SMALL }}>
                                    {dateStr}
                                </Spacer>
                            )}
                            <span className={bem('fixture', 'desktop')}>
                                <span className={bem('team', 'home')}>
                                    {fixture.hTname} <span className={hScoreClass}>{hScore}</span>
                                </span>
                                vs
                                <span className={bem('team', 'away')}>
                                    <span className={aScoreClass}>{aScore}</span> {fixture.aTname}
                                </span>
                            </span>
                            <span className={bem('fixture', 'mobile')}>
                                <span className={bem('team', 'home')}>
                                    {fixture.hTshortName} <span className={hScoreClass}>{hScore}</span>
                                </span>
                                vs
                                <span className={bem('team', 'away')}>
                                    <span className={aScoreClass}>{aScore}</span> {fixture.aTshortName}
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
