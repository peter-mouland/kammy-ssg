import React from 'react';
import PropTypes from 'prop-types';
import jsonQuery from 'json-query';
import bemHelper from '@kammy/bem';
import parse from 'date-fns/parse';

import './game-week-fixtures.scss';

const bem = bemHelper({ block: 'club-fixtures' });
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toDate = (string = '') => (!string) ? string : parse(string);
const getResult = ([hTeam, aTeam, hScore, aScore, something, isComplete, time]) => ({
  hTeam, aTeam, hScore, aScore, something, isComplete, time,
});

const getResults = (scores = []) => scores.reduce((prev, curr) => {
  const results = getResult(curr);
  return ({
    ...prev,
    [results.hTeam]: results,
    [results.aTeam]: results,
  });
}, {});

const teamAlias = {
  'West Ham United': 'West Ham',
  'Tottenham Hotspur': 'Spurs',
  'Manchester City': 'Man City',
  'Crystal Palace': 'Palace',
  'Leicester City': 'Leicester',
};

const getTeamName = (team) => teamAlias[team] || team;

// todo: put in selector
const getGwFixtures = (data, { start, end }) => (
  jsonQuery('fixtures[*:date]', {
    data,
    locals: {
      date(item) {
        const fixtureDate = toDate(item.date);
        const endDate = toDate(end);
        const startDate = toDate(start);
        return fixtureDate <= endDate && fixtureDate >= startDate;
      },
    },
  })
);

class GameWeekFixtures extends React.Component {
  static propTypes = {
    fetchLiveScores: PropTypes.func.isRequired,
    fetchFixtures: PropTypes.func.isRequired,
    start: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // string or moment
    end: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // string or moment
    liveScores: PropTypes.object,
    liveScoresLoaded: PropTypes.bool,
    loading: PropTypes.bool,
    fixtures: PropTypes.shape({
      hTname: PropTypes.string,
      aTname: PropTypes.string,
      date: PropTypes.string,
      aScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      hScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  };

  componentDidMount() {
    const {
      loading, fixtures, fetchFixtures, fetchLiveScores, liveScoresLoaded,
    } = this.props;
    if (!loading && !fixtures) {
      fetchFixtures();
    }
    if (!liveScoresLoaded) fetchLiveScores();
  }

  render() {
    const {
      fixtures, loading, start, end, liveScores,
    } = this.props;

    const gwFixtures = fixtures ? getGwFixtures(fixtures, { start, end }) : null;
    const liveMatches = getResults(liveScores.matches);
    const liveState = liveScores.gamestatus && liveScores.gamestatus[0].state;
    const isLive = liveState === 'ON';
    let previousFullDate = '';

    return (
      <div>
        {loading && 'Loading...'}
        {isLive && <p className={bem('live')}>live Scores (may change)</p>}
        {
          gwFixtures && gwFixtures.value.map((fixture) => {
            const date = toDate(fixture.date);
            const fullDate = `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`;
            const dateStr = fullDate === previousFullDate ? null : <h2>{fullDate}</h2>;
            const aTeamLiveScore = liveMatches[getTeamName(fixture.aTname)];
            const hTeamLiveScore = liveMatches[getTeamName(fixture.hTname)];
            const aScore = isLive && aTeamLiveScore ? aTeamLiveScore.aScore : fixture.aScore;
            const hScore = isLive && hTeamLiveScore ? hTeamLiveScore.hScore : fixture.hScore;
            const aScoreClass = bem({ live: isLive && aTeamLiveScore });
            const hScoreClass = bem({ live: isLive && hTeamLiveScore });
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
  }
}

export default GameWeekFixtures;
