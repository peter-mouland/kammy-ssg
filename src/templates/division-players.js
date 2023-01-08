/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import useLiveScores from '../hooks/use-live-scores';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'isAvailable', 'new', 'value', 'code'];
const visibleStats = ['points', 'apps', 'gls', 'asts', 'cs', 'con', 'pensv', 'bp', 'sb', 'ycard', 'rcard'];

const PlayersPage = ({ data, pageContext: { divisionKey, divisionLabel } }) => {
    const { liveStatsByCode } = useLiveScores();
    const players = data.allPlayers.nodes;
    const disabledPlayers = data.teamPlayers.nodes.reduce(
        (prev, player) => ({
            ...prev,
            [player.playerCode]: player,
        }),
        {},
    );
    return (
        <Layout title={`${divisionLabel} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={divisionKey} />
                <div className="page-content">
                    <PlayersFilters players={players} positions={positions}>
                        {(playersFiltered) => (
                            <PlayersTable
                                positions={positions}
                                liveStatsByCode={liveStatsByCode}
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
        teamPlayers: allTeams(filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }) {
            nodes {
                managerName
                playerCode
                player {
                    code
                    web_name
                }
            }
        }
        allPlayers(filter: { isHidden: { eq: false } }) {
            nodes {
                id
                code
                name: web_name
                chance_of_playing_this_round
                chance_of_playing_next_round
                club
                pos
                new
                isHidden
                isAvailable
                availNews
                url
                season {
                    apps
                    gls
                    asts
                    cs
                    con
                    pensv
                    ycard
                    rcard
                    bp
                    sb
                    points
                }
            }
        }
    }
`;

export default PlayersPage;
