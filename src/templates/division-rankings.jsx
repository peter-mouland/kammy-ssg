/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import * as DivisionRankings from '../components/division-rankings';
import TabbedMenu, { GameWeekNav } from '../components/tabbed-division-menu';
import useGameWeeks from '../hooks/use-game-weeks';
import { DivisionStandings } from '../models/standings';
import NavBar from '../components/nav-bar';
import useDivisions from '../hooks/use-divisions';
import usePositions from '../hooks/use-positions';
import useManagers from '../hooks/use-managers';

const DivisionHomePage = ({ data, pageContext: { gameWeekIndex, divisionId } }) => {
    const GameWeeks = useGameWeeks();
    const {
        allLeagueTable: { nodes: managersStats },
    } = data;
    const Positions = usePositions();
    const Divisions = useDivisions();
    const Managers = useManagers();
    const Division = Divisions.getDivision(divisionId);
    const Standings = new DivisionStandings({ managersStats });

    return (
        <Layout.Container title={`${Division.label} - Standings`}>
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.SecondaryNav>
                <TabbedMenu selected="rankings" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.SecondaryNav>
            <Layout.TertiaryNav>
                <GameWeekNav selected="rankings" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.TertiaryNav>
            <Layout.Body>
                <DivisionRankings.Container>
                    <Layout.Title>Standings</Layout.Title>
                    <DivisionRankings.SeasonTotals
                        selectedGameWeek={gameWeekIndex}
                        GameWeeks={GameWeeks}
                        Managers={Managers}
                        Positions={Positions}
                        Standings={Standings.rankStandings}
                    />
                </DivisionRankings.Container>
                <DivisionRankings.Container>
                    <Layout.Title>Weekly Scores</Layout.Title>
                    <DivisionRankings.GameWeekChange
                        selectedGameWeek={gameWeekIndex}
                        GameWeeks={GameWeeks}
                        Managers={Managers}
                        Positions={Positions}
                        Standings={Standings.rankChangeStandings}
                    />
                </DivisionRankings.Container>
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query DivisionRankings($gameWeekIndex: Int, $divisionId: String) {
        allLeagueTable(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, divisionId: { eq: $divisionId } }
            sort: [
                { manager: { division: { order: ASC } } }
                { points: { total: { rank: ASC } } }
                { points: { total: { seasonPoints: ASC } } }
            ]
        ) {
            nodes {
                gameWeekIndex
                points {
                    wa {
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
                    ca {
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
                    managerId
                    divisionId
                }
            }
        }
    }
`;

export default DivisionHomePage;
