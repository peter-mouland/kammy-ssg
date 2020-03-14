import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../pages/homepage';
import { getGameWeeks } from "../selectors/game-weeks.selectors";

const Index = ({ data }) => {
    const {
      selectedGameWeek,
      allManagers:  { nodes: managers },
      allDivisions: { nodes: divisions },
      allGameWeeks: { nodes: gameWeeks },
      allLeagueTable: { nodes: leagueStats }
    } = data;
    const selectedGameWeekIndex =  parseInt(selectedGameWeek.gameWeek, 10);
    const gameWeekDates = getGameWeeks({ gameWeeks: { selectedGameWeek: selectedGameWeekIndex, data: { gameWeeks }} });
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
            <Homepage selectedGameWeek={selectedGameWeek} gameWeekDates={gameWeekDates} divisions={divisions} statsByDivision={statsByDivision} />
        </Layout>
    );
};

export const query = graphql`

  query Homepage($gameWeek: Int) {
    selectedGameWeek: gameWeeks(gameWeek: {eq: $gameWeek}) {
      gameWeek
      isCurrent
      start
      end
      cup
      notes
    }
    allGameWeeks(sort: {fields: gameWeek}) {
      nodes {
        gameWeek
        isCurrent
        start
        end
        cup
        notes
      }
      totalCount
    }
    allDivisions(sort: {fields: order}) {
      nodes {
        key
        label
        order
      }
    }
    allLeagueTable(filter: {gameWeek: {eq: $gameWeek}}, sort: {fields: manager___division___order}) {
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
    allManagers(sort: {fields: division___order}) {
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
