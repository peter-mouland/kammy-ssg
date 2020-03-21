/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Transfers from '../components/division-transfers';

const TransfersPage = ({
    data: { currentGameWeek, prevGameWeek, allManagers },
    pageContext: { gameWeek: selectedGameWeek, divisionLabel },
}) => {
    return (
        <Layout>
            <h1>{divisionLabel}: Transfers</h1>
            <Transfers
                managers={allManagers}
                currentGameWeek={currentGameWeek}
                prevGameWeek={prevGameWeek}
                selectedGameWeek={selectedGameWeek}
            />
        </Layout>
    );
};

export const query = graphql`
    query DivisionTransfers($gameWeek: Int, $prevGameWeek: Int, $divisionKey: String) {
        currentGameWeek: gameWeeks(gameWeek: {eq: $gameWeek}) {
            gameWeek
            isCurrent
            start
            end
            cup
            notes
            fixtures {
                aScore
                aTcode
                aTname
                date
                hScore
                hTcode
                hTname
                status
            }
        }
        prevGameWeek: gameWeeks(gameWeek: {eq: $prevGameWeek}) {
            gameWeek
            isCurrent
            start
            end
            cup
            notes
            fixtures {
                aScore
                aTcode
                aTname
                date
                hScore
                hTcode
                hTname
                status
            }
        }
        allManagers(sort: { fields: division___order }, filter: { divisionKey: { eq: $divisionKey } }) {
            nodes {
                manager
                division {
                    key
                }
            }
        }
    }
`;

export default TransfersPage;
