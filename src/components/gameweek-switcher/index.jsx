import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';

import { findRoute } from '../named-link';
import FormattedGameWeekDate from '../gameweek-date';
import './gameweek-switcher.css';
import useGameWeeks from '../../hooks/use-game-weeks';

const GameWeekSwitcher = ({ to, selectedGameWeek }) => {
    const [showSwitcher, toggleSwitcher] = React.useState(false);
    const { gameWeeks } = useGameWeeks();
    const route = findRoute({ to });
    return (
        <span style={{ position: 'relative', zIndex: 10 }}>
            <button
                style={{ display: 'inline-block', padding: 0 }}
                onClick={() => (to ? toggleSwitcher(!showSwitcher) : null)}
                type="button"
            >
                <FormattedGameWeekDate gameWeek={gameWeeks[selectedGameWeek]} isSelected />
            </button>
            {showSwitcher ? (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        zIndex: '1',
                        maxHeight: '150px',
                        overflowY: 'scroll',
                        background: 'white',
                        whiteSpace: 'nowrap',
                        boxShadow:
                            'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                    }}
                >
                    {gameWeeks.map(({ id }) => (
                        <div style={{ margin: '0.15em 0', fontSize: '0.7em' }} key={id}>
                            <Link to={`/week-${id}${route.path}`}>
                                <FormattedGameWeekDate isSelected={selectedGameWeek === id} gameWeek={gameWeeks[id]} />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : null}
        </span>
    );
};

GameWeekSwitcher.propTypes = {
    to: PropTypes.string.isRequired,
    selectedGameWeek: PropTypes.number.isRequired,
};

export default GameWeekSwitcher;
