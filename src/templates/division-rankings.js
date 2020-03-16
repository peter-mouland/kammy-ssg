/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionRankings from '../components/division-rankings';

const Index = ({ data, pageContext: { gameWeek, divisionKey, divisionLabel } }) => {
    const {
        allLeagueTable: { nodes: leagueStats },
    } = data;

    return (
        <Layout>
            <DivisionRankings
                label={divisionLabel}
                divisionId={divisionKey}
                divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
                stats={leagueStats}
                gameWeek={gameWeek}
                showGameWeekSwitcher={true}
                showChart={false}
                showWeekly={true}
            />
        </Layout>
    );
};

export const query = graphql`
  query DivisionRankings($gameWeek: Int, $divisionKey: String) {
    allLeagueTable(
        filter: { gameWeek: {eq: $gameWeek}, divisionKey: {eq: $divisionKey }},
        sort: {fields: manager___division___order}
    ) {
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
  }
`;

export default Index;
