/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import * as DivisionRankings from '../components/division-rankings';
import TabbedMenu from '../components/tabbed-division-menu';
import useGameWeeks from '../hooks/use-game-weeks';
import CPositions from '../models/position';
import CDivisions from '../models/division';
import CManagers from '../models/managers';
import { DivisionStandings } from '../models/standings';

const DivisionHomePage = ({ data, pageContext: { gameWeek: selectedGameWeek, divisionKey } }) => {
    const GameWeeks = useGameWeeks();
    const {
        allManagers: { nodes: allManagers },
        allLeagueTable: { nodes: managersStats },
    } = data;

    const Positions = new CPositions();
    const Divisions = new CDivisions();
    const Division = Divisions.byId[divisionKey];
    const Managers = new CManagers(allManagers);
    const Standings = new DivisionStandings({ managersStats });

    return (
        <Layout.Container title={`${Division.label} - Standings`}>
            <Layout.Body>
                <TabbedMenu selected="rankings" division={divisionKey} selectedGameWeek={selectedGameWeek} />
                <DivisionRankings.Container>
                    <DivisionRankings.Title>{Division.label}: League Table</DivisionRankings.Title>
                    <DivisionRankings.SeasonTotals
                        selectedGameWeek={selectedGameWeek}
                        GameWeeks={GameWeeks}
                        Managers={Managers}
                        Positions={Positions}
                        Standings={Standings.rankStandings}
                    />
                </DivisionRankings.Container>
                <DivisionRankings.Container>
                    <DivisionRankings.Title>Weekly Scores</DivisionRankings.Title>
                    <DivisionRankings.GameWeekChange
                        selectedGameWeek={selectedGameWeek}
                        GameWeeks={GameWeeks}
                        Managers={Managers}
                        Positions={Positions}
                        Standings={Standings.rankChangeStandings}
                    />
                </DivisionRankings.Container>
                {/* <DivisionRankings*/}
                {/*    label={`${divisionLabel}: League Table`}*/}
                {/*    divisionId={divisionKey}*/}
                {/*    divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}*/}
                {/*    stats={leagueStats}*/}
                {/*    selectedGameWeek={selectedGameWeek}*/}
                {/*    showGameWeekSwitcher*/}
                {/*    showChart={false}*/}
                {/*    showWeekly*/}
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query DivisionRankings($gameWeek: Int, $divisionKey: String) {
        allManagers(filter: { divisionKey: { eq: $divisionKey } }, sort: { division: { order: ASC } }) {
            nodes {
                label: manager
                id: managerKey
                divisionId: divisionKey
            }
        }

        allLeagueTable(
            filter: { gameWeek: { eq: $gameWeek }, divisionKey: { eq: $divisionKey } }
            sort: [
                { manager: { division: { order: ASC } } }
                { points: { total: { rank: ASC } } }
                { points: { total: { seasonPoints: ASC } } }
            ]
        ) {
            nodes {
                gameWeek
                points {
                    am {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                    cb {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                    fb {
                        seasonPoints
                        gameWeekPoints
                        rank
                        rankChange
                    }
                    gks {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                    str {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                    total {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                    mid {
                        gameWeekPoints
                        seasonPoints
                        rank
                        rankChange
                    }
                }
                manager {
                    managerId: managerKey
                    division {
                        divisionId: key
                    }
                }
            }
        }
    }
`;

export default DivisionHomePage;
