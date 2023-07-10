import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Table from './division-rankings.table';
import Spacer from '../spacer';

const bem = bemHelper({ block: 'division-stats' });

const DivisionRankings = ({ stats = [], showStandings, showWeekly }) => (
    <section id="division-ranking-page" className={bem(null, null, 'page-content')}>
        <div style={{ position: 'relative', zIndex: 1 }}>
            {showStandings && (
                <Fragment>
                    {showWeekly && (
                        <h2 data-b-layout="v-space">
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>Overall Standings</Spacer>
                        </h2>
                    )}
                    <div data-b-layout="row vpad">
                        <Table points={stats} type="seasonPoints" rank="rank" />
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
                        <Table points={stats} type="gameWeekPoints" rank="rankChange" />
                    </div>
                </Fragment>
            )}
        </div>
    </section>
);

DivisionRankings.propTypes = {
    selectedGameWeek: PropTypes.number,
    divisionUrl: PropTypes.string,
    stats: PropTypes.array,
    showGameWeekSwitcher: PropTypes.bool,
    showWeekly: PropTypes.bool,
    showStandings: PropTypes.bool,
};

DivisionRankings.defaultProps = {
    selectedGameWeek: 0,
    stats: [],
    showGameWeekSwitcher: true,
    showWeekly: true,
    showStandings: true,
    divisionUrl: null,
};

DivisionRankings.contextTypes = {
    appConfig: PropTypes.object,
};

export default DivisionRankings;
