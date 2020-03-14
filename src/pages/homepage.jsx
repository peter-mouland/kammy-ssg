import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import DivisionRankings from '../components/division-rankings';
// import Interstitial from '../components/interstitial';
// import GameWeekFixtures from '../components/gameweek-fixtures';
import GameWeekDate from '../components/gameweek-date';
import Modal from '../components/modal';
import './styles.scss';

const bem = bemHelper({ block: 'home-page' });

class Homepage extends React.Component {
  state = {
    showTransfers: false,
  }

  showFixtures = (gameWeekFixtures) => {
    this.setState({ showTransfers: true, gameWeekFixtures });
  }

  render() {
    const { gameWeekDates, selectedGameWeek, divisions, statsByDivision } = this.props;
    const { currentGameWeekDates, nextGameWeekDates, prevGameWeekDates } = gameWeekDates;
    const { showTransfers, gameWeekFixtures } = this.state;

    return (
      <section id="home-page" className={bem()} >
        <div className='homepage-dates'>
          <div className={'homepage__prev-date'}>{
            prevGameWeekDates && (
              <a onClick={() => this.showFixtures(prevGameWeekDates)}>
                <GameWeekDate
                  gameWeek={prevGameWeekDates}
                  calStart={`
                      GW${prevGameWeekDates.gameWeek}
                  `}
                  showEnd={false}
                  showStartTime={false}
                />
              </a>
            )}
          </div>
          <div className={'homepage__gw-date'}>
            <a onClick={() => this.showFixtures(currentGameWeekDates)}>
              <GameWeekDate gameWeek={currentGameWeekDates} />
            </a>
          </div>
          <div className={'homepage__next-date'}>
            <a onClick={() => this.showFixtures(nextGameWeekDates)}>
              {
                nextGameWeekDates ? (
                  <GameWeekDate
                    gameWeek={nextGameWeekDates}
                    calEnd={`GW${nextGameWeekDates.gameWeek}`}
                    showStart={false}
                    showEndTime={false}
                  />
                )
                  : (
                    <GameWeekDate
                      gameWeek={currentGameWeekDates}
                      calEnd={'fin.'}
                      showStart={false}
                      showEndTime={false}
                    />
                  )}
            </a>
          </div>
        </div>
        <Modal
          id={'GameWeekFixtures'}
          title={`GW${gameWeekFixtures && gameWeekFixtures.gameWeek} Fixtures`}
          open={showTransfers}
          onClose={() => this.setState({ showTransfers: false })}
          style={{ maxWidth: '700px' }}
        >
          {/*<GameWeekFixtures {...gameWeekFixtures}/>*/}
        </Modal>
        {divisions.map(({ label, key }) => (
          <DivisionRankings
            key={key}
            label={label}
            divisionId={key}
            stats={statsByDivision[key]}
            showGameWeekSwitcher={false}
            showChart={false}
            showWeekly={false}
          />
        ))}
      </section>
    );
  }
}


Homepage.propTypes = {
  fetchAllPlayerData: PropTypes.func,
  fetchGameWeeks: PropTypes.func,
  fetchLiveScores: PropTypes.func,
  liveScoresLoaded: PropTypes.bool,
  loaded: PropTypes.bool,
  playersLoaded: PropTypes.bool,
  gameWeeksLoaded: PropTypes.bool,
  gameWeeks: PropTypes.object,
  liveScores: PropTypes.object,
  divisions: PropTypes.array,
};

Homepage.defaultProps = {
  divisions: [],
};

export default Homepage;
