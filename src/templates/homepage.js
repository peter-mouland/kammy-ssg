/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../components/homepage';
import useGameWeeks from '../hooks/use-game-weeks';

const Index = ({ data, pageContext: { gameWeek: selectedGameWeek } }) => {
    const { previousGameWeek, currentGameWeek, nextGameWeek } = useGameWeeks();
    const {
        allManagers: { nodes: managers },
        allDivisions: { nodes: divisions },
        allLeagueTable: { nodes: leagueStats },
    } = data;
    const gameWeekDates = {
        currentGameWeek,
        nextGameWeek,
        prevGameWeek: previousGameWeek,
    };
    const statsByDivision = managers.reduce(
        (prev, { manager, division }) => ({
            ...prev,
            [division.key]: [
                ...(prev[division.key] || []),
                {
                    managerName: manager,
                    points: leagueStats.find((stats) => stats.managerName === manager).points,
                    division: division.key,
                    divisionLabel: division.label,
                    divisionOrder: division.order,
                },
            ],
        }),
        {},
    );

    return (
        <Layout title="Homepage">
            <Homepage
                selectedGameWeek={selectedGameWeek}
                gameWeekDates={gameWeekDates}
                divisions={divisions}
                statsByDivision={statsByDivision}
            />
        </Layout>
    );
};

export const query = graphql`
    query Homepage($gameWeek: Int) {
        allDivisions(sort: { fields: order }) {
            nodes {
                key
                label
                order
            }
        }
        allLeagueTable(filter: { gameWeek: { eq: $gameWeek } }, sort: { fields: manager___division___order }) {
            nodes {
                gameWeek
                points {
                    am {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                    cb {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                    fb {
                        seasonPoints
                        gameWeekPoints
                        rank
                    }
                    gks {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                    str {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                    total {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                    mid {
                        gameWeekPoints
                        seasonPoints
                        rank
                    }
                }
                managerName
                manager {
                    manager
                    division {
                        key
                        label
                        order
                    }
                }
            }
        }
        allManagers(sort: { fields: division___order }) {
            nodes {
                manager
                division {
                    key
                }
            }
        }
    }
`;

export default Index;
