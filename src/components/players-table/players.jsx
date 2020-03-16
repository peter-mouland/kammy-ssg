import React from 'react';
import PropTypes from 'prop-types';

import PlayersFilters from './players-filters';
import PlayersTable from './players-table';

class Players extends React.Component {
    render() {
        const {
            players, positions, visibleStats,
        } = this.props;

        return (
            <div>
                <PlayersFilters
                    players={players}
                    positions={positions}
                >
                    {(playersFiltered) => (
                        <PlayersTable
                            positions={positions}
                            players={playersFiltered}
                            visibleStats={visibleStats}
                            // onPlayerClick={this.setShowFixtures}
                        />
                    )}
                </PlayersFilters>
            </div>
        );
    }
}

Players.propTypes = {
    visibleStats: PropTypes.array.isRequired,
    positions: PropTypes.array.isRequired,
    fetchPlayers: PropTypes.func,
    players: PropTypes.array,
    myTeam: PropTypes.object,
    loading: PropTypes.bool,
    errors: PropTypes.object,
};

Players.defaultProps = {
    loading: true,
    myTeam: null,
    players: null,
    errors: null,
};

export default Players;
