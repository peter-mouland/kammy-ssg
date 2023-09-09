/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';
import CPositions from '../models/position';
import { Stats } from '../models/stats';
import CDivisions from '../models/division';
import usePlayers from '../hooks/use-players';
import useClubs from '../hooks/use-clubs';

const bemTable = bemHelper({ block: 'players-page-table' });

const PlayersPage = ({ data, pageContext: { divisionId, gameWeekIndex } }) => {
    const Divisions = new CDivisions();
    const Division = Divisions.getDivision(divisionId);
    const Positions = new CPositions();
    const StatsList = new Stats();
    const teamPlayers = data.teamPlayers.nodes;
    const allPlayers = usePlayers();
    const clubs = useClubs();
    const disabledPlayers = teamPlayers.reduce((prev, { player }) => {
        // eslint-disable-next-line no-param-reassign
        prev[player.code] = true;
        return prev;
    }, {});
    return (
        <Layout title={`${Division.label} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={Division.id} selectedGameWeek={gameWeekIndex} />
                <div className="page-content">
                    <PlayersFilters players={allPlayers.all} positions={Positions} clubs={clubs}>
                        {(playersFiltered) => (
                            <PlayersTable
                                Positions={Positions}
                                players={playersFiltered}
                                disabledPlayers={disabledPlayers}
                                Stats={StatsList}
                            />
                        )}
                    </PlayersFilters>
                </div>
            </section>
        </Layout>
    );
};

export const query = graphql`
    query AllPlayers($gameWeekIndex: Int, $divisionId: String) {
        teamPlayers: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
        ) {
            nodes {
                managerId
                player {
                    code
                }
            }
        }
    }
`;

export default PlayersPage;
