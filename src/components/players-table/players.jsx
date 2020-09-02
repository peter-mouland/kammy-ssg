import React from 'react';
import PropTypes from 'prop-types';

import PlayersFilters from './players-filters';
import PlayersTable from './players-table';

const Players = ({ players, positions, visibleStats }) => (
    <div>
        <PlayersFilters players={players} positions={positions}>
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

Players.propTypes = {
    visibleStats: PropTypes.array.isRequired,
    positions: PropTypes.array.isRequired,
    players: PropTypes.array,
};

Players.defaultProps = {
    players: null,
};

export default Players;
