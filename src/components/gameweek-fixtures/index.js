import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import parse from 'date-fns/parse';

import './game-week-fixtures.scss';

const bem = bemHelper({ block: 'club-fixtures' });
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toDate = (string = '') => (!string) ? string : parse(string);

const GameWeekFixtures = ({ fixtures }) => {
  let previousFullDate = '';
  return (
    <div>
      {
        fixtures && fixtures.map((fixture) => {
          const date = toDate(fixture.date);
          const fullDate = `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`;
          const dateStr = fullDate === previousFullDate ? null : <h2>{fullDate}</h2>;
          const aScore = fixture.aScore;
          const hScore = fixture.hScore;
          const aScoreClass = bem();
          const hScoreClass = bem();
          previousFullDate = fullDate;
          return (
            <div key={`${fixture.date}-${fixture.hTname}`} className={bem('fixtures') }>
              {dateStr}
              <span className={bem('fixture', 'desktop')}>
                <span className={bem('team', 'home')}>{fixture.hTname} <span className={hScoreClass}>{hScore}</span></span>
                vs
                <span className={bem('team', 'away')}><span className={aScoreClass}>{aScore}</span> {fixture.aTname}</span>
              </span>
              <span className={bem('fixture', 'mobile')}>
                <span className={bem('team', 'home')}>{fixture.hTcode} <span className={hScoreClass}>{hScore}</span></span>
                vs
                <span className={bem('team', 'away')}><span className={aScoreClass}>{aScore}</span> {fixture.aTcode}</span>
              </span>
            </div>
          );
        })
      }
    </div>
  );
};

GameWeekFixtures.propTypes = {
  fixtures: PropTypes.shape({
    hTname: PropTypes.string,
    aTname: PropTypes.string,
    date: PropTypes.string,
    aScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default GameWeekFixtures;
