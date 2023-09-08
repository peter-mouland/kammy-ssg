/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';
import { Players } from '../models/players';
import CPositions from '../models/position';
import { Stats } from '../models/stats';

const bemTable = bemHelper({ block: 'players-page-table' });

const PlayersPage = ({ data, pageContext: { divisionKey, divisionLabel, gameWeek: selectedGameWeek } }) => {
    const { clubs } = data.allClubs;
    const Positions = new CPositions();
    const StatsList = new Stats();
    const allPlayers = new Players(data.allPlayers.nodes);
    const teamPlayers = data.teamPlayers.nodes;
    const disabledPlayers = useMemo(
        () =>
            teamPlayers.reduce(
                (prev, player) => ({
                    ...prev,
                    [player.playerCode]: player,
                }),
                {},
            ),
        [teamPlayers],
    );
    return (
        <Layout title={`${divisionLabel} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={divisionKey} selectedGameWeek={selectedGameWeek} />
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
    query AllPlayers($gameWeek: Int, $divisionKey: String) {
        allClubs: allPlayers {
            clubs: distinct(field: { club: SELECT })
        }
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
                code
                name: web_name
                club
                positionId: pos
                new
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
