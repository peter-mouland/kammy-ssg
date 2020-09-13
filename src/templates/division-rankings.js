/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionRankings from '../components/division-rankings';
import TabbedMenu from '../components/tabbed-division-menu';

const Index = ({ data, pageContext: { gameWeek: selectedGameWeek, divisionKey, divisionLabel } }) => {
    const {
        allLeagueTable: { nodes: leagueStats },
    } = data;

    return (
        <Layout>
            <div data-b-layout="container">
                <TabbedMenu selected="rankings" division={divisionKey} />
                <DivisionRankings
                    label={`${divisionLabel}: League Table`}
                    divisionId={divisionKey}
                    divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
                    stats={leagueStats}
                    selectedGameWeek={selectedGameWeek}
                    showGameWeekSwitcher
                    showChart={false}
                    showWeekly
                />
            </div>
        </Layout>
    );
};

export const query = graphql`
    query DivisionRankings($gameWeek: Int, $divisionKey: String) {
        allLeagueTable(
            filter: { gameWeek: { eq: $gameWeek }, divisionKey: { eq: $divisionKey } }
            sort: { fields: manager___division___order }
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
    }
`;

export default Index;
