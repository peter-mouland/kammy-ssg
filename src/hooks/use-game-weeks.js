/* eslint-disable react/no-danger */
import { graphql, useStaticQuery } from 'gatsby';

import GameWeeks from '../models/game-weeks';

const useGameWeeks = () => {
    const {
        allGameWeeks: { nodes: gw },
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
    return new GameWeeks(gw);
};

export default useGameWeeks;
