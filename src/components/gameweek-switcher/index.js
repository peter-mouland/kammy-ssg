import React from 'react';
import { useStaticQuery, graphql, Link } from 'gatsby';
import bemHelper from '@kammy/bem';

import FormattedGameWeekDate from '../gameweek-date';
import MultiToggle from '../multi-toggle';
import './gameweek-switcher.scss';
import './multi-toggle.scss';
import ContextualHelp from '../contextual-help';

const bem = bemHelper({ block: 'game-week-switcher' });
const bemToggle = bemHelper({ block: 'multi-toggle' });

const GameWeekSwitcher = ({ url = '' }) => {
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
    const previousGameWeeks = [...gameWeeks].slice(0, currentGameWeek.gameWeek + 1 + 1);
    const options = previousGameWeeks.length > 4
      ? previousGameWeeks.slice(previousGameWeeks.length - 4, currentGameWeek.gameWeek + 1 + 1)
      : previousGameWeeks;
    return (
      <section id="gameweek-switcher" className={bem()}>
        GameWeek:
        {options.map(({ gameWeek, isCurrent }) => {
          return <Link key={gameWeek} to={`/week-${gameWeek}${url}`} className={''}>
              <ContextualHelp
                body={<FormattedGameWeekDate gameWeek={gameWeeks[gameWeek]}/>}
                Trigger={(
                  <span className={ bemToggle('option-label', { isCurrent: !!isCurrent }) } >{gameWeek}</span>
                )}
              />
          </Link>
        })}
      </section>
    );
};

export default GameWeekSwitcher;
