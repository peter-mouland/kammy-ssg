/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Manager from '../components/manager';

// todo:
//    1. need all manager teams to work out valid transfers
//    2. auto validate swap
const ManagerPage = ({ data, pageContext: { managerName, managerKey, divisionKey, gameWeek } }) => (
    <Layout title={managerName}>
        <Manager
            divisionKey={divisionKey}
            gameWeek={gameWeek}
            managerName={managerName}
            managerKey={managerKey}
            currentTeams={data.currentTeams.nodes}
        />
    </Layout>
);

export const query = graphql`
    query CurrentTeam($gameWeek: Int, $divisionKey: String) {
        currentTeams: allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }
            sort: { managerName: ASC }
        ) {
            nodes {
                playerCode
                teamPos
                pos
                posIndex
                manager {
                    key: managerKey
                    name: manager
                }
                player {
                    club
                    name: web_name
                    code
                    pos
                    url
                    isAvailable
                    availNews
                }
            }
        }
    }
`;
export default ManagerPage;
