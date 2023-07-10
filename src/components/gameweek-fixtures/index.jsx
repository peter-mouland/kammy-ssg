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
    const [showFixture, onShowFixture] = React.useState(null);
    let previousFullDate = '';
    const theme = 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {fixtures &&
                    fixtures.map((fixture) => {
                        if (!fixture || !fixture.date) return <React.Fragment />;
                        const fullDate = toFullDate(fixture);
                        if (fullDate === previousFullDate) return <React.Fragment />;
                        previousFullDate = fullDate;
                        const themeClass = `theme-${theme}`;
                        return (
                            <div key={fixture.id} className={bem('fixtures', themeClass)}>
                                <button
                                    type="button"
                                    onClick={() => onShowFixture(showFixture === fullDate ? null : fullDate)}
                                >
                                    <h2 title={fixture.date}>{fullDate}</h2>
                                </button>
                            </div>
                        );
                    })}
            </div>

            <div>
                {fixtures &&
                    fixtures.map((fixture) => {
                        if (!fixture || !fixture.date) return <React.Fragment />;
                        const fullDate = toFullDate(fixture);
                        if (showFixture !== fullDate) return <React.Fragment />;
                        const { aScore, hScore } = fixture;
                        const aScoreClass = bem();
                        const hScoreClass = bem();
                        previousFullDate = fullDate;
                        const themeClass = `theme-${theme}`;
                        return (
                            <div key={fixture.id} className={bem('fixtures', themeClass)}>
                                <div>
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
                            </div>
                        );
                    })}
            </div>
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
