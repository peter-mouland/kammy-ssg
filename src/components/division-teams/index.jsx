import React from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import StatsTable from './DivisionStats.table';
import TeamWarnings from '../team-warnings';

const bem = bemHelper({ block: 'division-stats' });

const DivisionTeams = ({ teams, previousTeams, selectedGameWeek }) => {
    const [cookies] = useCookies(['is-admin']);
    // const [positionTimelineProps, togglePosTimeline] = useState(null);
    const isAdmin = cookies['is-admin'] === 'true' || false;

    return (
        <section id="teams-page" className={bem()}>
            {isAdmin && <TeamWarnings teams={teams} />}

            <div data-b-layout="vpad">
                <div className={bem(null, null, 'page-content')} data-b-layout="row vpad">
                    <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
                        <StatsTable
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
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
};

DivisionTeams.defaultProps = {
    selectedGameWeek: 1,
    teams: null,
    previousTeams: null,
};

export default DivisionTeams;
