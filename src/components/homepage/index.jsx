import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import DivisionRankings from '../division-rankings';
import GameWeekFixtures from '../gameweek-fixtures';
import GameWeekDate from '../gameweek-date';
import Drawer from '../drawer';
import './styles.scss';
import Spacer from '../spacer';

const bem = bemHelper({ block: 'home-page' });

class Homepage extends React.Component {
    state = {
        showTransfers: false,
    };

    showFixtures = (selectedGameWeek) => {
        this.setState({ showTransfers: true, selectedGameWeek });
    };

    render() {
        const { gameWeekDates, divisions, statsByDivision } = this.props;
        if (!gameWeekDates) return null;
        const { currentGameWeek, nextGameWeek, prevGameWeek } = gameWeekDates;
        const { showTransfers, selectedGameWeek } = this.state;

        return (
            <section id="home-page" className={bem()}>
                <div className="homepage-dates">
                    <div className="homepage__prev-date">
                        {prevGameWeek && (
                            <a onClick={() => this.showFixtures(prevGameWeek)}>
                                <GameWeekDate
                                    gameWeek={prevGameWeek}
                                    calStart={`
                      GW${prevGameWeek.gameWeek}
                  `}
                                    showEnd={false}
                                    showStartTime={false}
                                />
                            </a>
                        )}
                    </div>
                    <div className="homepage__gw-date">
                        <a onClick={() => this.showFixtures(currentGameWeek)}>
                            <GameWeekDate gameWeek={currentGameWeek} />
                        </a>
                    </div>
                    <div className="homepage__next-date">
                        <a onClick={() => this.showFixtures(nextGameWeek)}>
                            {nextGameWeek ? (
                                <GameWeekDate
                                    gameWeek={nextGameWeek}
                                    calEnd={`GW${nextGameWeek.gameWeek}`}
                                    showStart={false}
                                    showEndTime={false}
                                />
                            ) : (
                                <GameWeekDate
                                    gameWeek={currentGameWeek}
                                    calEnd="fin."
                                    showStart={false}
                                    showEndTime={false}
                                />
                            )}
                        </a>
                    </div>
                </div>
                <Drawer
                    id="GameWeekFixtures"
                    isOpen={showTransfers}
                    placement={Drawer.placements.RIGHT}
                    onClose={() => this.setState({ showTransfers: false })}
                >
                    <Spacer all={{ vertical: Spacer.spacings.HUGE, horizontal: Spacer.spacings.MEDIUM }}>
                        <Spacer all={{ bottom: Spacer.spacings.MEDIUM }}>
                            <h2>GW{selectedGameWeek && selectedGameWeek.gameWeek} Fixtures</h2>
                        </Spacer>
                        <GameWeekFixtures {...selectedGameWeek} />
                    </Spacer>
                </Drawer>
                {divisions.map(({ label, key }) => (
                    <DivisionRankings
                        key={key}
                        label={label}
                        divisionId={key}
                        gameWeek={currentGameWeek.gameWeek}
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
    gameWeekDates: PropTypes.object,
    statsByDivision: PropTypes.object,
    divisions: PropTypes.array,
};

Homepage.defaultProps = {
    statsByDivision: {},
    divisions: [],
    gameWeekDates: null,
};

export default Homepage;
