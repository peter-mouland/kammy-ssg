/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import Spacer from '../components/spacer';
import useGameWeeks from '../hooks/use-game-weeks';
import useMeta from '../hooks/use-meta';
import CManagers from '../models/managers';
import CDivisions from '../models/division';
import CStandings from '../models/standings';
import CPositions from '../models/position';
import * as DivisionRankings from '../components/division-rankings';
import NamedLink from '../components/named-link';

const HomepageIndex = ({ data, pageContext: { gameWeekIndex: selectedGameWeek } }) => {
    const { formattedTime, getFromNow } = useMeta();
    const GameWeeks = useGameWeeks();
    const {
        allManagers: { nodes: allManagers },
        allLeagueTable: { group: divisionStats },
    } = data;

    const Positions = new CPositions();
    const Divisions = new CDivisions();
    const Managers = new CManagers(allManagers);
    const Standings = new CStandings(divisionStats);

    return (
        <Layout.Container title="Homepage">
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
        allManagers(sort: { division: { order: ASC } }) {
            nodes {
                label
                managerId
                divisionId
            }
        }

        allLeagueTable(
            filter: { gameWeekIndex: { eq: $gameWeekIndex } }
            sort: { manager: { division: { order: ASC } } }
        ) {
            group(field: { manager: { division: { id: SELECT } } }) {
                managersStats: nodes {
                    gameWeekIndex
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
                        managerId
                        divisionId
                    }
                }
            }
        }
    }
`;

export default HomepageIndex;
