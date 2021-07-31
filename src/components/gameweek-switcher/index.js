import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';
import bemHelper from '@kammy/bem';

import FormattedGameWeekDate from '../gameweek-date';
import './gameweek-switcher.scss';
import ContextualHelp from '../contextual-help';
import Spacer from '../spacer';
import useGameWeeks from '../../hooks/use-game-weeks';

const bem = bemHelper({ block: 'game-week-switcher' });

const GameWeekSwitcher = ({ url, selectedGameWeek }) => {
    const { gameWeeks, currentGameWeek = {}, nextGameWeek } = useGameWeeks();
    const previousGameWeeks = gameWeeks
        .filter(({ gameWeek }) => gameWeek <= currentGameWeek.gameWeek)
        .slice(0, selectedGameWeek + 1);

    const options =
        previousGameWeeks.length > 2
            ? previousGameWeeks.slice(previousGameWeeks.length - 2, selectedGameWeek + 1)
            : previousGameWeeks;

    if (!options.includes(currentGameWeek)) {
        options.push(currentGameWeek);
    }
    if (!options.includes(nextGameWeek)) {
        options.push(nextGameWeek);
    }
    return (
        <section id="gameweek-switcher" className={bem()}>
            <Spacer tag="span" all={{ top: Spacer.spacings.SMALL }}>
                <Spacer tag="span" all={{ right: Spacer.spacings.MEDIUM }}>
                    GameWeek:
                </Spacer>
                {options.map(({ gameWeek, isCurrent }) => (
                    <Link key={gameWeek} to={`/week-${gameWeek}${url}`} className="">
                        <ContextualHelp
                            body={<FormattedGameWeekDate gameWeek={gameWeeks[gameWeek]} />}
                            Trigger={
                                <span
                                    className={bem('option-label', {
                                        isCurrent: !!isCurrent,
                                        isSelected: selectedGameWeek === gameWeek,
                                    })}
                                >
                                    {gameWeek}
                                </span>
                            }
                        />
                    </Link>
                ))}
            </Spacer>
        </section>
    );
};

GameWeekSwitcher.propTypes = {
    url: PropTypes.string,
    selectedGameWeek: PropTypes.number.isRequired,
};

GameWeekSwitcher.defaultProps = {
    url: '',
};

export default GameWeekSwitcher;
