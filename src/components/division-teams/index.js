import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Modal from '../modal';
import StatsTable from './DivisionStats.table';
import PositionTimeline from './components/PositionTimeline.table';
import PlayerTimeline from './components/PlayerTimeline.table';
import TeamWarnings from '../team-warnings';

const bem = bemHelper({ block: 'division-stats' });

const DivisionTeams = ({ teams, previousTeams, selectedGameWeek, divisionUrl }) => {
    const [cookies] = useCookies(['is-admin']);
    const [positionTimelineProps, togglePosTimeline] = useState(null);
    const [playerTimelineProps, togglePlayerTimeline] = useState(false);
    const isAdmin = cookies['is-admin'] === 'true' || false;

    return (
        <section id="teams-page" className={bem()}>
            <div data-b-layout="vpad">
                <GameWeekSwitcher url={`/${divisionUrl}/teams`} selectedGameWeek={selectedGameWeek} />
            </div>

            {isAdmin && <TeamWarnings teams={teams} />}

            <div data-b-layout="vpad">
                <div className={bem(null, null, 'page-content')} data-b-layout="row vpad">
                    <div>
                        {positionTimelineProps && (
                            <Modal
                                key="timeline"
                                id="timeline"
                                wide
                                title={`${positionTimelineProps.position} Timeline`}
                                open={!!positionTimelineProps}
                                onClose={() => togglePosTimeline(null)}
                            >
                                <PositionTimeline {...positionTimelineProps} />
                            </Modal>
                        )}
                        {playerTimelineProps && (
                            <Modal
                                key="player-timeline"
                                id="player-timeline"
                                wide
                                title={`${playerTimelineProps.player.name} Timeline`}
                                open={!!playerTimelineProps}
                                onClose={() => togglePlayerTimeline(null)}
                            >
                                <PlayerTimeline {...playerTimelineProps} />
                            </Modal>
                        )}
                    </div>
                    <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
                        <StatsTable
                            onShowPositionTimeline={togglePosTimeline}
                            onShowPlayerTimeline={togglePlayerTimeline}
                            selectedGameWeek={selectedGameWeek}
                            teams={teams}
                            previousTeams={previousTeams}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

DivisionTeams.propTypes = {
    selectedGameWeek: PropTypes.number,
    divisionUrl: PropTypes.string.isRequired,
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
};

DivisionTeams.defaultProps = {
    selectedGameWeek: 1,
    teams: null,
    previousTeams: null,
};

export default DivisionTeams;
