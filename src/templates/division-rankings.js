import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionRankings from '../components/division-rankings';

const Index = ({ data, pageContext: { divisionKey, divisionLabel } }) => {
    const {
      allManagers:  { nodes: managers },
      allLeagueTable: { nodes: leagueStats }
    } = data;

    const statsByDivision = managers.reduce((prev, { manager, division }) => ({
      ...prev,
      [division.key] : [
        ...(prev[division.key] || []),
        {
          manager,
          points: leagueStats.find((stats) => stats.managerName === manager).points,
          division: division.key,
          divisionLabel: division.label,
          divisionOrder: division.order,
        }
      ],
    }), {});

    return (
        <Layout>
          <DivisionRankings
            label={divisionLabel}
            divisionId={divisionKey}
            stats={statsByDivision[divisionKey]}
            showGameWeekSwitcher={false}
            showChart={false}
            showWeekly={false}
          />
        </Layout>
    );
};

export const query = graphql`
  query DivisionRankings($gameWeek: Int, $divisionKey: String) {
    allLeagueTable(filter: {gameWeek: {eq: $gameWeek}, divisionKey: {eq: $divisionKey }}, sort: {fields: manager___division___order}) {
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
    allManagers(sort: {fields: division___order}, filter: {divisionKey: {eq: $divisionKey}}) {
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
