/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../components/homepage';
import useGameWeeks from '../hooks/use-game-weeks';
import useMeta from '../hooks/use-meta';
import Spacer from './spacer';

const HomepageIndex = ({ data, pageContext: { gameWeek: selectedGameWeek } }) => {
    const { formattedTime, getFromNow } = useMeta();
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
        (prev, { manager, managerKey, divisionKey }) => ({
            ...prev,
            [divisionKey]: [
                ...(prev[divisionKey] || []),
                {
                    manager: {
                        name: manager,
                        key: managerKey,
                    },
                    points: leagueStats.find((stats) => stats.manager.name === manager).points,
                    division: divisionKey,
                },
            ],
        }),
        {},
    );

    const footer = (
        <Spacer
            all={{ vertical: Spacer.spacings.MEDIUM, horizontal: Spacer.spacings.LARGE }}
            style={{ fontSize: '0.9em' }}
        >
            <strong style={{ color: '#888', fontSize: '0.9em' }}>Last Build:</strong> {formattedTime}{' '}
            <small style={{ color: '#888', fontSize: '0.9em' }}>({getFromNow()})</small>
        </Spacer>
    );

    return (
        <Layout title="Homepage" footer={footer}>
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
                manager {
                    key: managerKey
                    name: manager
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
                managerKey
                divisionKey
            }
        }
    }
`;

export default HomepageIndex;
