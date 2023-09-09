exports.createSchemaCustomization = async ({ actions }) => {
    const { createTypes } = actions;
    createTypes(`
      type Players implements Node {
        gameWeeks: [playersGameWeeks]
      }

      type playersGameWeeks {
        fixtures: [playersGameWeeksFixtures]
      }

      type TeamFixture {
            code: Int
            team_id: Int
            draw: Int
            id: Int
            name: String
            played: Int
            points: Int
            position: Int
            short_name: String
            strength: Int
            strength_overall_home: Int
            strength_overall_away: Int
            strength_attack_home: Int
            strength_attack_away: Int
            strength_defence_home: Int
            strength_defence_away: Int
      }
      type playersGameWeeksFixtures {
        awayTeam: TeamFixture
        homeTeam: TeamFixture
        team_a_score: Int
        team_h_score: Int
        date: String
        is_home: Boolean
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
