exports.createSchemaCustomization = async ({ actions }) => {
    const { createTypes } = actions;
    createTypes(`
      type Players implements Node {
        gameWeeks: [playersGameWeeks]
      }

      type playersGameWeeks {
        fixtures: [playersGameWeeksFixtures]
      }

      type playersGameWeeksFixtures {
        aScore: Int
        aTcode: Int
        aTname: String
        aTshortName: String
        team_h_score: Int
        team_a_score: Int
        date: String
        opponent_team: String
        was_home: Boolean
        stats: playersGameWeeksFixturesStats
      }

      type playersGameWeeksFixturesStats {
            apps: Int
            gls: Int
            asts: Int
            cs: Int
            con: Int
            pensv: Int
            ycard: Int
            rcard: Int
            sb: Int
            bp: Int
            points: Int
        }
    `);
};
