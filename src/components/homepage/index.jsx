import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import DivisionRankings from '../division-rankings';
import GameWeekFixtures from '../gameweek-fixtures';
import GameWeekDate from '../gameweek-date';
import Drawer from '../drawer';
import './styles.css';
import Spacer from '../spacer';
import NamedLink from '../named-link';

const bem = bemHelper({ block: 'home-page' });

const Homepage = ({ gameWeekDates, divisions, statsByDivision }) => {
    const [{ showFixtures, selectedGameWeek }, setState] = React.useState({
        showFixtures: false,
    });

    const setShowFixtures = (gameWeek) => setState({ showFixtures: true, selectedGameWeek: gameWeek });
    const { currentGameWeek = {}, nextGameWeek = {}, prevGameWeek = {} } = gameWeekDates;

    if (!gameWeekDates) return null;
    return (
        <section id="home-page" className={bem()}>
            <div className="homepage-dates">
                <div className="homepage__prev-date">
                    {prevGameWeek && (
                        <a onClick={() => setShowFixtures(prevGameWeek)}>
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
                    <a onClick={() => setShowFixtures(currentGameWeek)}>
                        <GameWeekDate gameWeek={currentGameWeek} />
                    </a>
                </div>
                <div className="homepage__next-date">
                    <a onClick={() => setShowFixtures(nextGameWeek)}>
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
                isOpen={showFixtures}
                placement={Drawer.placements.RIGHT}
                onClose={() => setState({ showFixtures: false })}
            >
                <Spacer all={{ vertical: Spacer.spacings.HUGE, horizontal: Spacer.spacings.MEDIUM }}>
                    <Spacer all={{ bottom: Spacer.spacings.MEDIUM }}>
                        <h2>GW{selectedGameWeek && selectedGameWeek.gameWeek} Fixtures</h2>
                    </Spacer>
                    <GameWeekFixtures {...selectedGameWeek} />
                </Spacer>
            </Drawer>
            {divisions.map(({ label, key }) => (
                <div data-b-layout="container" key={key}>
                    <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                        <h2>
                            <NamedLink to={`${key}-rankings`}>{label}</NamedLink>
                        </h2>
                    </Spacer>
                    <DivisionRankings
                        key={key}
                        stats={statsByDivision[key]}
                        showGameWeekSwitcher={false}
                        selectedGameWeek={selectedGameWeek}
                        showWeekly={false}
                    />
                </div>
            ))}
        </section>
    );
};

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
