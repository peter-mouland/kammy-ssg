/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import Layout from '../components/layout';

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'value', 'code'];
const visibleStats = [
    'points', 'apps', 'subs', 'gls', 'asts', 'cs', 'con', 'pensv', 'sb', 'tb', 'ycard', 'rcard',
];

const PlayersPage = ({ data, pageContext: { divisionLabel } }) => {
    const players = data.allPlayers.nodes;
    const disabledPlayers = data.teamPlayers.nodes.reduce((prev, player) => ({
        ...prev,
        [player.playerName]: player,
    }), {});
    return (
        <Layout>
            <section id="players-page" className={bemTable()}>
                <h1>{divisionLabel}: Players</h1>
                <div className="page-content">
                    <PlayersFilters
                        players={players}
                        positions={positions}
                    >
                        {(playersFiltered) => (
                            <PlayersTable
                                positions={positions}
                                players={playersFiltered}
                                disabledPlayers={disabledPlayers}
                                hiddenColumns={hiddenColumns}
                                visibleStats={visibleStats}
                            />
                        )}
                    </PlayersFilters>
                </div>
            </section>
        </Layout>
    );
};

export const query = graphql`
    query AllPlayers($gameWeek: Int, $divisionKey: String) {
        teamPlayers: allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
        ) {
            nodes {
                managerName
                playerName
            }
        }
        allPlayers(filter: {isHidden: {eq: false}}) {
            nodes {
                id
                name
                club
                pos
                new
                isHidden
                season {
                    apps
                    subs
                    gls
                    asts
                    cs
                    con
                    pensv
                    ycard
                    rcard
                    tb
                    sb
                    points
                }
            }
        }
    }
`;

export default PlayersPage;