import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../pages/homepage';
import { getGameWeeks } from "../selectors/game-weeks.selectors";

const Index = ({ data }) => {
    const { allDivisions: { nodes: divisions }, selectedGameWeek, allGameWeeks: { nodes: gameWeeks }, allPlayers: { nodes: players } } = data;
    const gameWeekDates = getGameWeeks({ gameWeeks: { selectedGameWeek: parseInt(selectedGameWeek.gameWeek, 10), data: { gameWeeks }} });
    return (
        <Layout>
            <Homepage selectedGameWeek={selectedGameWeek} gameWeekDates={gameWeekDates} divisions={divisions} />
        </Layout>
    );
};

export const query = graphql`
  query Homepage($gameWeek: String) {
    selectedGameWeek: gameWeeks(gameWeek: { eq: $gameWeek }) {
      cup
      end
      gameWeek
      isCurrent
      start
      notes
    }
    allGameWeeks {
      nodes {
        cup
        end
        gameWeek
        isCurrent
        start
        notes
      }
      totalCount
    }
    allDivisions {
      nodes {
        key
        label
        order
      }
    }
    allPlayers {
      nodes {
        id
        code
        pos
        name
        club
        skySportsPosition
        isHidden
        new
        value
        fixtures {
          aScore
          aTname
          date
          event
          hScore
          hTname
          status
          stats
        }
        season {
          apps
          asts
          con
          cs
          gls
          pensv
          points
          rcard
          sb
          subs
          tb
          ycard
        }
        gameWeek {
          apps
          asts
          con
          cs
          gls
          pensv
          points
          rcard
          sb
          subs
          tb
          ycard
        }
      }
    }
  }
`;

export default Index;
