import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Modal from '../modal';
import Table from './DivisionStats.table';
import PositionTimeline from './components/PositionTimeline.table';
import PlayerTimeline from './components/PlayerTimeline.table';
import AdminWarnings from './components/admin-warnings';

const bem = bemHelper({ block: 'division-stats' });

const DivisionStats = ({ teams, previousTeams, selectedGameWeek, divisionUrl }) => {
    const [cookies] = useCookies(['is-admin']);
    const [positionTimelineProps, togglePosTimeline] = useState(null);
    const [playerTimelineProps, togglePlayerTimeline] = useState(false);
    const isAdmin = cookies['is-admin'] === 'true' || false;

    return (
        <section id="teams-page" className={bem()} data-b-layout="container">
            <div data-b-layout="vpad">
                <GameWeekSwitcher url={`/${divisionUrl}/teams`} selectedGameWeek={selectedGameWeek} />
            </div>

            {isAdmin && <AdminWarnings teams={teams} />}

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
                        <Table
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

DivisionStats.propTypes = {
    selectedGameWeek: PropTypes.number,
    label: PropTypes.string.isRequired,
    divisionUrl: PropTypes.string.isRequired,
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
};

DivisionStats.defaultProps = {
    selectedGameWeek: 1,
    teams: null,
    previousTeams: null,
};

export default DivisionStats;
