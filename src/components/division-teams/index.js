import React from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
// import Modal from '../modal';
import StatsTable from './DivisionStats.table';
// import PositionTimeline from './components/PositionTimeline.table';
import TeamWarnings from '../team-warnings';
import useSquadChanges from '../../hooks/use-squad-changes';

const bem = bemHelper({ block: 'division-stats' });

const DivisionTeams = ({ teamsByManager, previousTeams, selectedGameWeek, divisionUrl, divisionKey }) => {
    const { newTeams } = useSquadChanges({ selectedGameWeek, divisionKey, teamsByManager });
    const [cookies] = useCookies(['is-admin']);
    // const [positionTimelineProps, togglePosTimeline] = useState(null);
    const isAdmin = cookies['is-admin'] === 'true' || false;

    return (
        <section id="teams-page" className={bem()}>
            <div data-b-layout="vpad">
                <GameWeekSwitcher url={`/${divisionUrl}/teams`} selectedGameWeek={selectedGameWeek} />
            </div>

            {isAdmin && <TeamWarnings teams={newTeams} />}

            <div data-b-layout="vpad">
                <div className={bem(null, null, 'page-content')} data-b-layout="row vpad">
                    <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
                        <StatsTable
                            selectedGameWeek={selectedGameWeek}
                            teams={newTeams}
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
    divisionUrl: PropTypes.string.isRequired,
    divisionKey: PropTypes.string.isRequired,
    selectedGameWeek: PropTypes.number,
    teamsByManager: PropTypes.object,
    previousTeams: PropTypes.object,
};

DivisionTeams.defaultProps = {
    selectedGameWeek: 1,
    teamsByManager: null,
    previousTeams: null,
};

export default DivisionTeams;
