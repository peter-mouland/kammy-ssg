import React from 'react';
import PropTypes from 'prop-types';
// import { Cookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Table from './DivisionStats.table';

const bem = bemHelper({ block: 'division-stats' });

class DivisionStats extends React.Component {
    render() {
        const {
            label, teams, previousTeams, selectedGameWeek, divisionUrl,
        } = this.props;
        return (
            <section id="teams-page" className={bem()} data-b-layout="container">
                <h1>{label}</h1>
                <div data-b-layout="vpad">
                    <GameWeekSwitcher
                        url={`/${divisionUrl}/teams`}
                        selectedGameWeek={selectedGameWeek}
                    />
                </div>
                <div data-b-layout="vpad">
                    <Table
                        selectedGameWeek={selectedGameWeek}
                        teams={teams}
                        previousTeams={previousTeams}
                        // isAdmin={cookies.get('is-admin') === 'true' || false}
                    />
                </div>
            </section>
        );
    }
}

DivisionStats.propTypes = {
    selectedGameWeek: PropTypes.number.isRequired,
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
