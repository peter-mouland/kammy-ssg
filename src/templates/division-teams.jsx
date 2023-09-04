/* eslint-disable react/prop-types */
import { graphql } from 'gatsby';
import React from 'react';

import DivisionTeams from '../components/division-teams';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';

const Index = ({ data, pageContext: { gameWeek: selectedGameWeek, divisionLabel, divisionKey } }) => {
    const {
        currentTeams: { group: currentTeams },
        previousTeams: { group: previousTeams },
    } = data;

    const teamsByManager = currentTeams.reduce(
        (previous, { nodes: team }) => ({
            ...previous,
            [team[0].manager.name]: team,
        }),
        {},
    );
    const previousTeamsByManager = (previousTeams || []).reduce(
        (previous, { nodes: team }) => ({
            ...previous,
            [team[0].manager.name]: team,
        }),
        {},
    );

    return (
        <Layout title={`${divisionLabel} - Teams`}>
            <div data-b-layout="container">
                <TabbedMenu division={divisionKey} selected="teams" selectedGameWeek={selectedGameWeek} />
                <DivisionTeams
                    divisionUrl={divisionLabel.toLowerCase().replaceAll(' ', '-')}
                    previousTeams={previousTeamsByManager}
                    selectedGameWeek={selectedGameWeek}
                    teams={teamsByManager}
                />
            </div>
        </Layout>
    );
};

export const query = graphql`
    query Teams($gameWeek: Int, $prevGameWeek: Int, $divisionKey: String) {
        currentTeams: allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
            sort: { managerName: ASC }
        ) {
            group(field: { managerName: SELECT }) {
                nodes {
                    manager {
                        key: managerKey
                        name: manager
                    }
                    playerCode
                    teamPos
                    pos
                    posIndex
                    player {
                        code
                        club
                        name: web_name
                        chance_of_playing_this_round
                        chance_of_playing_next_round
                        pos
                        new
                        isAvailable
                        availNews
                        url
                        value_season
                        value_form
                        gameWeeks {
                            fixtures {
                                opponent_team
                                date
                                aTname
                                was_home
                                is_home
                            }
                        }
                    }
                    seasonToGameWeek {
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
                    gameWeekStats {
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
        previousTeams: allTeams(
            filter: { gameWeek: { eq: $prevGameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
            sort: { managerName: ASC }
        ) {
            group(field: { managerName: SELECT }) {
                nodes {
                    manager {
                        key: managerKey
                        name: manager
                    }
                    playerCode
                    teamPos
                    pos
                    posIndex
                    player {
                        code
                        web_name
                    }
                }
            }
        }
    }
`;

export default Index;
