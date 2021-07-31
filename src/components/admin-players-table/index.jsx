import React from 'react';
import PropTypes from 'prop-types';
import '@kammy/bootstrap';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../players-table';

const bem = bemHelper({ block: 'players-page-table' });

const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];

const PlayersPageTable = ({ players }) => {
    const mismatchFilter = (player) => !player.pos;

    return (
        <section id="players-page" className={bem()}>
            <div className="page-content">
                <PlayersFilters
                    players={players}
                    positions={positions}
                    showNewToggle
                    showHiddenToggle
                    customFilter={{ fn: mismatchFilter, label: 'Show only mis-matches' }}
                >
                    {(playersFiltered) => (
                        <PlayersTable
                            positions={positions}
                            players={playersFiltered}
                            additionalColumns={['fplPosition']}
                        />
                    )}
                </PlayersFilters>
            </div>
        </section>
    );
};

PlayersPageTable.propTypes = {
    players: PropTypes.array,
};

PlayersPageTable.defaultProps = {
    players: [],
};

export default PlayersPageTable;
