/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import Spacer from '../components/spacer';
import useGameWeeks from '../hooks/use-game-weeks';
import useMeta from '../hooks/use-meta';
import CStandings from '../models/standings';
import * as DivisionRankings from '../components/division-rankings';
import NamedLink from '../components/named-link';
import NavBar from '../components/nav-bar';
import useDivisions from '../hooks/use-divisions';
import usePositions from '../hooks/use-positions';
import useManagers from '../hooks/use-managers';

const HomepageIndex = ({ data, pageContext: { gameWeekIndex: selectedGameWeek } }) => {
    const { formattedTime, getFromNow } = useMeta();
    const GameWeeks = useGameWeeks();
    const {
        allLeagueTable: { group: divisionStats },
    } = data;

    const Positions = usePositions();
    const Divisions = useDivisions();
    const Managers = useManagers();
    const Standings = new CStandings(divisionStats);

    return (
        <Layout.Container title="Homepage">
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.Body>
                {Divisions.getAll().map((Division) => (
                    <DivisionRankings.Container key={Division.id}>
                        <Layout.Title>
                            <NamedLink to={`${Division.id}-rankings`}>{Division.label}</NamedLink>
                        </Layout.Title>
                        <DivisionRankings.SeasonTotals
                            selectedGameWeek={selectedGameWeek}
                            GameWeeks={GameWeeks}
                            Managers={Managers}
                            Positions={Positions}
                            Standings={Standings.byDivisionId[Division.id].rankStandings}
                        />
                    </DivisionRankings.Container>
                ))}
            </Layout.Body>
            <Layout.Footer>
                <Spacer
                    all={{ vertical: Spacer.spacings.MEDIUM, horizontal: Spacer.spacings.LARGE }}
                    style={{ fontSize: '0.9em' }}
                >
                    <strong style={{ color: '#888', fontSize: '0.9em' }}>Last Build:</strong> {formattedTime}{' '}
                    <small style={{ color: '#888', fontSize: '0.9em' }}>({getFromNow()})</small>
                </Spacer>
            </Layout.Footer>
        </Layout.Container>
    );
};

export const query = graphql`
    query Homepage($gameWeekIndex: Int) {
        allLeagueTable(
            filter: { gameWeekIndex: { eq: $gameWeekIndex } }
            sort: { manager: { division: { order: ASC } } }
        ) {
            group(field: { manager: { division: { id: SELECT } } }) {
                managersStats: nodes {
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
    }
`;

export default HomepageIndex;
