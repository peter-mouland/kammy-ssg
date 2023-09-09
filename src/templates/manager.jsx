/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Manager from '../components/manager';

// todo:
//    1. need all manager teams to work out valid transfers
//    2. auto validate swap
const ManagerPage = ({ data, pageContext: { managerId, divisionId, gameWeek } }) => (
    <Layout title={managerId}>
        <Manager
            divisionId={divisionId}
            gameWeek={gameWeek}
            managerId={managerId}
            currentTeams={data.currentTeams.nodes}
        />
    </Layout>
);

export const query = graphql`
    query CurrentTeam($gameWeekIndex: Int, $divisionId: String) {
        currentTeams: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
            sort: { managerId: ASC }
        ) {
            nodes {
                playerCode
                playerPositionId
                squadPositionId
                squadPositionIndex
                manager {
                    managerId
                    label
                }
                player {
                    club
                    name
                    code
                    positionId
                    url
                }
            }
        }
    }
`;
export default ManagerPage;
