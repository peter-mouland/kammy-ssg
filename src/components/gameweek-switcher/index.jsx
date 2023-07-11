import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';

import { findRoute } from '../named-link';
import FormattedGameWeekDate from '../gameweek-date';
import './gameweek-switcher.css';
import useGameWeeks from '../../hooks/use-game-weeks';

const GameWeekSwitcher = ({ to, selectedGameWeek }) => {
    const [showSwitcher, toggleSwitcher] = React.useState(false);
    const { currentGameWeek = {}, gameWeeks } = useGameWeeks();
    const route = findRoute({ to });
    return (
        <div>
            <button
                style={{ display: 'inline-block', width: '150px', fontSize: '1.3em', padding: 0 }}
                onClick={() => (to ? toggleSwitcher(!showSwitcher) : null)}
                type="button"
            >
                <FormattedGameWeekDate gameWeek={gameWeeks[selectedGameWeek]} isCurrent isSelected />
            </button>
            {showSwitcher ? (
                <div
                    style={{
                        maxHeight: '300%',
                        overflowY: 'scroll',
                        background: 'white',
                        boxShadow:
                            'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                    }}
                >
                    {gameWeeks.map(({ gameWeek }) => (
                        <div style={{ margin: '0.15em 0' }} key={gameWeek}>
                            <Link to={`/week-${gameWeek}${route.path}`} className="">
                                <FormattedGameWeekDate
                                    isSelected={false}
                                    gameWeek={gameWeeks[gameWeek]}
                                    isCurrent={gameWeek === currentGameWeek.gameWeek}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

GameWeekSwitcher.propTypes = {
    to: PropTypes.string.isRequired,
    selectedGameWeek: PropTypes.number.isRequired,
};

export default GameWeekSwitcher;
