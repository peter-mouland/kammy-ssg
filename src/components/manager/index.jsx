/* eslint-disable react/prop-types */
import React from 'react';

import Spacer from '../spacer';
import MakeChanges from './components/makes-changes';
import GwPoints from './components/gw-points';

const CHANGES = 'CHANGES';
const GW_POINTS = 'GW_POINTS';

const Manager = ({ currentTeams, managerId, gameWeek, divisionId }) => {
    const [showTab, setShowTab] = React.useState(GW_POINTS);
    const teamsByManager = currentTeams.reduce((prev, teamItem) => {
        const team = prev[teamItem.manager.name] || [];
        return {
            ...prev,
            [teamItem.manager.name]: [...team, teamItem],
        };
    }, []);
    const currentTeam = teamsByManager[managerId];
    return (
        <section id="managers-page" data-b-layout="container">
            <div className="page-content">
                <Spacer all={{ stack: Spacer.spacings.MEDIUM }}>
                    <h1>{managerId}&apos;s Team</h1>
                    <Spacer all={{ stackH: Spacer.spacings.SMALL }}>
                        <button type="button" onClick={() => setShowTab(GW_POINTS)}>
                            Current Team
                        </button>
                        <button type="button" onClick={() => setShowTab(CHANGES)}>
                            Changes
                        </button>
                    </Spacer>
                    {showTab === GW_POINTS ? <GwPoints currentTeam={currentTeam} /> : null}
                    {showTab === CHANGES ? (
                        <MakeChanges
                            teamsByManager={teamsByManager}
                            managerId={managerId}
                            divisionId={divisionId}
                            gameWeek={gameWeek}
                        />
                    ) : null}
                </Spacer>
            </div>
        </section>
    );
};

export default Manager;
