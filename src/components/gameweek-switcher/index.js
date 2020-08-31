import React from 'react';
import PropTypes from 'prop-types';
import { useStaticQuery, graphql, Link } from 'gatsby';
import bemHelper from '@kammy/bem';

import FormattedGameWeekDate from '../gameweek-date';
import './gameweek-switcher.scss';
import './multi-toggle.scss';
import ContextualHelp from '../contextual-help';
import Spacer from '../spacer';

const bem = bemHelper({ block: 'game-week-switcher' });
const bemToggle = bemHelper({ block: 'multi-toggle' });

const GameWeekSwitcher = ({ url = '', selectedGameWeek }) => {
    const data = useStaticQuery(graphql`
      query AllGameWeeks {
        allGameWeeks {
          nodes {
            gameWeek
            isCurrent
            start
            end
            cup
          }
        }
      }
    `);
    const gameWeeks = data.allGameWeeks.nodes;
    const currentGameWeek = gameWeeks.find(({ isCurrent }) => !!isCurrent);
    const previousGameWeeks = [...gameWeeks].slice(0, selectedGameWeek + 1 + 1);
    const options = previousGameWeeks.length > 4
        ? previousGameWeeks.slice(previousGameWeeks.length - 4, selectedGameWeek + 1 + 1)
        : previousGameWeeks;
    if (!options.includes(currentGameWeek)) {
        if (selectedGameWeek > currentGameWeek.gameWeek) {
            options.unshift(currentGameWeek);
        } else {
            options.push(currentGameWeek);
        }
    }
    return (
        <section id="gameweek-switcher" className={bem()}>
            <Spacer tag={'span'} all={{ right: Spacer.spacings.MEDIUM }}>
                GameWeek:
            </Spacer>
            {options.map(({ gameWeek, isCurrent }) => (
                <Link key={gameWeek} to={`/week-${gameWeek}${url}`} className={''}>
                    <ContextualHelp
                        body={<FormattedGameWeekDate gameWeek={gameWeeks[gameWeek]}/>}
                        Trigger={(
                            <span className={ bemToggle('option-label', { isCurrent: !!isCurrent, isSelected: selectedGameWeek === gameWeek }) }>{gameWeek}</span>
                        )}
                    />
                </Link>
            ))}
        </section>
    );
};

GameWeekSwitcher.propTypes = {
    url: PropTypes.string,
    selectedGameWeek: PropTypes.number,
};

export default GameWeekSwitcher;
