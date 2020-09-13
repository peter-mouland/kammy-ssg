import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import ErrorBoundary from '../error-boundary';
import Chart from '../divisions-ranking-chart';
import Table from './division-rankings.table';
import Spacer from '../spacer';

const bem = bemHelper({ block: 'division-stats' });

class DivisionRankings extends React.Component {
    state = { highlightManager: '' };

    handleRowHover = (manager) => {
        this.setState({ highlightManager: manager });
    };

    render() {
        const {
            stats = [],
            divisionUrl,
            lineChartData,
            managersSeason,
            lineType,
            showStandings,
            showWeekly,
            showChart,
            showGameWeekSwitcher,
            selectedGameWeek,
        } = this.props;
        const { highlightManager } = this.state;

        return (
            <section id="division-ranking-page" className={bem(null, null, 'page-content')}>
                {showGameWeekSwitcher && (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/rankings`} />
                    </div>
                )}
                {
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {showStandings && (
                            <Fragment>
                                {showWeekly && (
                                    <h2 data-b-layout="v-space">
                                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>Overall Standings</Spacer>
                                    </h2>
                                )}
                                <div data-b-layout="row vpad">
                                    <Table
                                        points={stats}
                                        type="seasonPoints"
                                        rank="rank"
                                        handleRowHover={this.handleRowHover}
                                    />
                                </div>
                            </Fragment>
                        )}
                        {showWeekly && (
                            <Fragment>
                                <div data-b-layout="row vpad">
                                    {showStandings && (
                                        <h2>
                                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>Weekly Scores</Spacer>
                                        </h2>
                                    )}
                                    <Table
                                        points={stats}
                                        type="gameWeekPoints"
                                        rank="rankChange"
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
                                        xAxis="gameWeekPoints"
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
    selectedGameWeek: PropTypes.number.isRequired,
    lineType: PropTypes.string,
    divisionUrl: PropTypes.string,
    managersSeason: PropTypes.object,
    stats: PropTypes.array,
    lineChartData: PropTypes.array,
    showGameWeekSwitcher: PropTypes.bool,
    showWeekly: PropTypes.bool,
    showChart: PropTypes.bool,
    showStandings: PropTypes.bool,
};

DivisionRankings.defaultProps = {
    lineType: undefined,
    managersSeason: {},
    stats: [],
    lineChartData: [],
    showGameWeekSwitcher: true,
    showWeekly: true,
    showChart: true,
    showStandings: true,
    divisionUrl: null,
};

DivisionRankings.contextTypes = {
    appConfig: PropTypes.object,
};

export default DivisionRankings;
