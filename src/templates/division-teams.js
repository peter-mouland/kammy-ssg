/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionStats from '../components/division-stats';

const Index = ({ data, pageContext: { gameWeek: selectedGameWeek, divisionKey, divisionLabel } }) => {
    const {
        allTeams: { group: teams },
    } = data;

    const teamsByManager = teams.reduce((prev, { nodes: team }) => ({
        ...prev,
        [team[0].managerName]: team,
    }), {});
    console.log(teamsByManager)
    return (
        <Layout>
            <DivisionStats
                label={divisionLabel}
                divisionId={divisionKey}
                divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
                teams={teamsByManager}
                selectedGameWeek={selectedGameWeek}
                showGameWeekSwitcher={true}
                showChart={false}
                showWeekly={true}
            />
        </Layout>
    );
};

export const query = graphql`
    query Teams($gameWeek: Int, $divisionKey: String) {
        allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } },
            sort: { fields: managerName }
        ) {
            group(field: managerName) {
                nodes {
                    managerName
                    playerName
                    teamPos
                    pos
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
