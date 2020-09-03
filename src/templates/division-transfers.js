/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionTransfers from '../components/division-transfers';
import TabbedMenu from '../components/tabbed-division-menu';

const TransfersPage = ({
    data: {
        currentTeams: { group: currentTeams },
    },
    pageContext: { gameWeek: selectedGameWeek, divisionLabel, divisionKey },
}) => {
    const teamsByManager = currentTeams.reduce(
        (prev, { nodes: team }) => ({
            ...prev,
            [team[0].managerName]: team,
        }),
        {},
    );

    const divisionUrl = divisionLabel.toLowerCase().replace(/ /g, '-');

    return (
        <Layout>
            <div data-b-layout="container">
                <TabbedMenu selected="transfers" division={divisionKey} />
            </div>
            <DivisionTransfers
                teamsByManager={teamsByManager}
                divisionLabel={divisionLabel}
                divisionKey={divisionKey}
                divisionUrl={divisionUrl}
                selectedGameWeek={selectedGameWeek}
            />
        </Layout>
    );
};

export const query = graphql`
    query DivisionTransfers($gameWeek: Int, $divisionKey: String) {
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
                    }
                }
            }
        }
    }
`;

export default TransfersPage;
