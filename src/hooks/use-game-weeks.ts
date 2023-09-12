/* eslint-disable react/no-danger */
import { graphql, useStaticQuery } from 'gatsby';

import GameWeeks, { GameWeek, GameWeekFixture } from '../models/game-weeks';

const useGameWeeks = () => {
    const {
        allGameWeeks: { nodes: gameweek },
    } = useStaticQuery(graphql`
        query GameWeeks {
            allGameWeeks(sort: { gameWeekIndex: ASC }) {
                nodes {
                    id: gameWeekIndex
                    gameWeekIndex
                    isCurrent
                    isNext
                    hasPassed
                    cup
                    start
                    end
                    sinceStartMs: end(difference: "start")
                    startFromNow: start(fromNow: true)
                    endFromNow: end(fromNow: true)
                    fixtures {
                        id
                        date
                        event
                        finished
                        team_a_score
                        team_h_score
                        awayTeam {
                            code
                            name
                        }
                        homeTeam {
                            code
                            name
                        }
                    }
                }
            }
        }
    `);
    return new GameWeeks(gameweek);
};

export default useGameWeeks;
export { GameWeek, GameWeekFixture };
