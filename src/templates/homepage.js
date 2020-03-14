import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Homepage from '../pages/homepage';
import { getGameWeeks } from "../selectors/game-weeks.selectors";

const Index = ({ data }) => {
    const { allDivisions: { nodes: divisions }, selectedGameWeek, allGameWeeks: { nodes: gameWeeks }, allLeagueTable: { group: { nodes: divisionStats } } } = data;
    const gameWeekDates = getGameWeeks({ gameWeeks: { selectedGameWeek: parseInt(selectedGameWeek.gameWeek, 10), data: { gameWeeks }} });
    const statsByDivision = divisionStats.reduce((prev, div) => ({
      ...prev,
      [div.division]: div,
    }), {});
    return (
        <Layout>
            <Homepage selectedGameWeek={selectedGameWeek} gameWeekDates={gameWeekDates} divisions={divisions} statsByDivision={statsByDivision} />
        </Layout>
    );
};

export const query = graphql`
  query Homepage($gameWeek: Int) {
    selectedGameWeek: gameWeeks(gameWeek: { eq: $gameWeek }) {
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
    allLeagueTable(filter: {gameWeek: { eq: $gameWeek }}) {
      group(field: division) {
        nodes {
          manager
          playerName
          pos
          posIndex
          gameWeek
          division
          teamPos
          seasonToGameWeek {
            apps
            points
          }
        }
      }
    }
  }
`;

export default Index;
