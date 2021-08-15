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
            [team[0].manager.name]: team,
        }),
        {},
    );
    const previousTeamsByManager = (previousTeams || []).reduce(
        (prev, { nodes: team }) => ({
            ...prev,
            [team[0].manager.name]: team,
        }),
        {},
    );

    return (
        <Layout title={`${divisionLabel} - Teams`}>
            <div data-b-layout="container">
                <TabbedMenu selected="teams" division={divisionKey} />
                <DivisionTeams
                    divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
                    teams={teamsByManager}
                    previousTeams={previousTeamsByManager}
                    selectedGameWeek={selectedGameWeek}
                />
            </div>
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
                        pos
                        new
                        isAvailable
                        availNews
                        url
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
            sort: { fields: managerName }
        ) {
            group(field: managerName) {
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
