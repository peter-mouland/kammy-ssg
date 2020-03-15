import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import DivisionRankings from '../components/division-rankings';

const Index = ({ data, pageContext: { gameWeek, divisionKey, divisionLabel } }) => {
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
console.log({gameWeek})
console.log({statsByDivision})
console.log({divisionKey})
    return (
        <Layout>
          <DivisionRankings
            label={divisionLabel}
            divisionId={divisionKey}
            divisionUrl={divisionLabel.toLowerCase().replace(/ /g, '-')}
            stats={statsByDivision[divisionKey]}
            gameWeek={gameWeek}
            showGameWeekSwitcher={true}
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
