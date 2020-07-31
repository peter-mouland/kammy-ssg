/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionTransfers from '../components/division-transfers';

const TransfersPage = ({
    data: {
        currentTeams: { group: currentTeams },
        currentGameWeek, prevGameWeek, gameWeekMinus2,
    },
    pageContext: { gameWeek: selectedGameWeek, divisionLabel, divisionKey },
}) => {
    const teamsByManager = currentTeams.reduce((prev, { nodes: team }) => ({
        ...prev,
        [team[0].managerName]: team,
    }), {});

    const divisionUrl = divisionLabel.toLowerCase().replace(/ /g, '-');

    return (
        <Layout>
            <h1>{divisionLabel}: Transfers</h1>
            <DivisionTransfers
                teamsByManager={teamsByManager}
                divisionKey={divisionKey}
                divisionUrl={divisionUrl}
                prevGameWeek={prevGameWeek}
                gameWeekMinus2={gameWeekMinus2}
                selectedGameWeek={selectedGameWeek}
            />
        </Layout>
    );
};

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
        currentTeams: allTeams(
            filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } },
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
