/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Transfers from '../components/division-transfers';

const TransfersPage = ({
    data: {
        currentGameWeek, prevGameWeek, gameWeekMinus2, allManagers,
    },
    pageContext: { gameWeek: selectedGameWeek, divisionLabel, divisionKey },
}) => (
    <Layout>
        <h1>{divisionLabel}: Transfers</h1>
        <Transfers
            managers={allManagers}
            divisionKey={divisionKey}
            divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
            currentGameWeek={currentGameWeek}
            prevGameWeek={prevGameWeek}
            gameWeekMinus2={gameWeekMinus2}
            selectedGameWeek={selectedGameWeek}
        />
    </Layout>
);

export const query = graphql`
    query DivisionTransfers($gameWeek: Int, $prevGameWeek: Int, $prev2GameWeek: Int, $divisionKey: String) {
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
            start
            end
            cup
            notes
        }
        gameWeekMinus2: gameWeeks(gameWeek: {eq: $prev2GameWeek}) {
            gameWeek
            start
            end
            cup
            notes
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
