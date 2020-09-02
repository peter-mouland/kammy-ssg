/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionTeams from '../components/division-teams';
import TabbedMenu from '../components/tabbed-division-menu';

const Index = ({ data, pageContext: { gameWeek: selectedGameWeek, divisionLabel, divisionKey } }) => {
    const {
        currentTeams: { group: currentTeams },
        previousTeams: { group: previousTeams },
    } = data;

    const teamsByManager = currentTeams.reduce(
        (prev, { nodes: team }) => ({
            ...prev,
            [team[0].managerName]: team,
        }),
        {},
    );
    const previousTeamsByManager = (previousTeams || []).reduce(
        (prev, { nodes: team }) => ({
            ...prev,
            [team[0].managerName]: team,
        }),
        {},
    );

    return (
        <Layout>
            <div data-b-layout="container">
                <TabbedMenu selected="teams" division={divisionKey} />
            </div>
            <DivisionTeams
                label={`${divisionLabel}: Teams`}
                divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
                teams={teamsByManager}
                previousTeams={previousTeamsByManager}
                selectedGameWeek={selectedGameWeek}
            />
        </Layout>
    );
};

export const query = graphql`
    query Teams($gameWeek: Int, $prevGameWeek: Int, $divisionKey: String) {
        currentTeams: allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
            sort: { fields: managerName }
        ) {
            group(field: managerName) {
                nodes {
                    managerName
                    playerName
                    teamPos
                    pos
                    posIndex
                    player {
                        club
                        name
                        gameWeeks {
                            fixtures {
                                id
                                aScore
                                aTcode
                                aTname
                                week
                                status
                                stats {
                                    apps
                                    asts
                                    con
                                    cs
                                    pensv
                                    gls
                                    points
                                    rcard
                                    sb
                                    subs
                                    tb
                                    ycard
                                }
                                pTcode
                                hTname
                                hTcode
                                hScore
                                event
                                date
                            }
                        }
                    }
                    seasonToGameWeek {
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
                    gameWeekStats {
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
        previousTeams: allTeams(
            filter: { gameWeek: { eq: $prevGameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
            sort: { fields: managerName }
        ) {
            group(field: managerName) {
                nodes {
                    managerName
                    playerName
                    teamPos
                    pos
                    posIndex
                    seasonToGameWeek {
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
                    gameWeekStats {
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
    }
`;

export default Index;
