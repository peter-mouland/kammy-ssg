import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import ErrorBoundary from '../error-boundary';
import Chart from '../divisions-ranking-chart';

import Table from './division-rankings.table';

const bem = bemHelper({ block: 'division-stats' });

class DivisionRankings extends React.Component {
  state = { highlightManager: '' }

  handleRowHover = (manager) => {
      this.setState({ highlightManager: manager });
  }

  render() {
      const {
          stats = [], divisionUrl, lineChartData, label, managersSeason, lineType,
          showStandings, showWeekly, showChart, showGameWeekSwitcher, selectedGameWeek,
      } = this.props;
      const { highlightManager } = this.state;
      const managers = stats.reduce((prev, stat) => ({ [stat.managerName]: stat }), {});

      return (
          <section id="division-ranking-page" className={bem(null, null, 'page-content')} data-b-layout="container">
              <h1>{label}</h1>
              {
                  showGameWeekSwitcher && (
                      <div style={{ position: 'relative', zIndex: 2 }}>
                          <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/rankings`} />
                      </div>
                  )
              }
              {
                  <div style={{ position: 'relative', zIndex: 1 }}>
                      {showStandings && (
                          <Fragment>
                              {showWeekly && <h2 data-b-layout="v-space">Overall Standings</h2>}
                              <div data-b-layout="row vpad">
                                  <Table
                                      managers={Object.keys(managers)}
                                      points={stats}
                                      type='seasonPoints'
                                      handleRowHover={this.handleRowHover}
                                  />
                              </div>
                          </Fragment>
                      )}
                      {showWeekly && (
                          <Fragment>
                              <div data-b-layout="row vpad">
                                  {showStandings && <h2>Weekly Scores</h2>}
                                  <Table
                                      managers={Object.keys(managers)}
                                      points={stats}
                                      type='gameWeekPoints'
                                  />
                              </div>
                          </Fragment>
                      )}
                      {showChart && (
                          <ErrorBoundary>
                              <div data-b-layout="row vpad">
                                  <Chart
                                      data={lineChartData}
                                      lines={Object.keys(managersSeason)}
                                      xAxis={'gameWeekPoints'}
                                      highlightManager={highlightManager}
                                      lineType={lineType}
                                  />
                              </div>
                          </ErrorBoundary>
                      )}
                  </div>
              }
          </section>
      );
  }
}

DivisionRankings.propTypes = {
    selectedGameWeek: PropTypes.number,
    lineType: PropTypes.string,
    divisionUrl: PropTypes.string.isRequired,
    divisionId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    managers: PropTypes.array,
    managersSeason: PropTypes.object,
    managersPoints: PropTypes.array,
    stats: PropTypes.array,
    managersRank: PropTypes.object,
    managersRankChange: PropTypes.object,
    lineChartData: PropTypes.array,

    showGameWeekSwitcher: PropTypes.bool,
    showWeekly: PropTypes.bool,
    showChart: PropTypes.bool,
    showStandings: PropTypes.bool,
};

DivisionRankings.defaultProps = {
    lineType: undefined,
    managersSeason: {},
    loaded: false,
    managers: [],
    stats: [],
    managersPoints: [],
    playersLoaded: false,
    gameWeeksLoaded: false,
    divisionLoaded: false,
    showGameWeekSwitcher: true,
    showWeekly: true,
    showChart: true,
    showStandings: true,
    gameWeeksCount: null,
};

DivisionRankings.contextTypes = {
    appConfig: PropTypes.object,
};

export default DivisionRankings;
