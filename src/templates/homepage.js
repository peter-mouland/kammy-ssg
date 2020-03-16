/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../components/homepage';

const Index = ({ data }) => {
    const {
        prevGameWeek,
        currentGameWeek,
        nextGameWeek,
        allManagers: { nodes: managers },
        allDivisions: { nodes: divisions },
        allLeagueTable: { nodes: leagueStats },
    } = data;
    const gameWeekDates = {
        currentGameWeek,
        nextGameWeek,
        prevGameWeek,
    };
    const statsByDivision = managers.reduce((prev, { manager, division }) => ({
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
    }), {});

    return (
        <Layout>
            <Homepage gameWeekDates={gameWeekDates} divisions={divisions} statsByDivision={statsByDivision} />
        </Layout>
    );
};

export const query = graphql`
  query Homepage($gameWeek: Int, $prevGameWeek: Int, $nextGameWeek: Int) {
    currentGameWeek: gameWeeks(gameWeek: {eq: $gameWeek}) {
      gameWeek
      isCurrent
      start
      end
      cup
      notes
      fixtures {
        aScore
        aTcode
        aTname
        date
        hScore
        hTcode
        hTname
        status
      }
    }
    prevGameWeek: gameWeeks(gameWeek: {eq: $prevGameWeek}) {
      gameWeek
      isCurrent
      start
      end
      cup
      notes
      fixtures {
        aScore
        aTcode
        aTname
        date
        hScore
        hTcode
        hTname
        status
      }
    }
    nextGameWeek: gameWeeks(gameWeek: {eq: $nextGameWeek}) {
      gameWeek
      isCurrent
      start
      end
      cup
      notes
      fixtures {
        aScore
        aTcode
        aTname
        date
        hScore
        hTcode
        hTname
        status
      }
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
