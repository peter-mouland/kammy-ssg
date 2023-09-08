/* eslint-disable react/no-danger */
import { graphql, useStaticQuery } from 'gatsby';

import GameWeeks from '../models/game-weeks';

const useGameWeeks = () => {
    const {
        allGameWeeks: { nodes: gw },
    } = useStaticQuery(graphql`
        query GameWeeks {
            allGameWeeks(sort: { gameWeek: ASC }) {
                nodes {
                    id: gameWeek
                    isCurrent
                    cup
                    start
                    end
                    startFromNow: start(fromNow: true)
                    endFromNow: end(fromNow: true)
                    fixtures {
                        id
                        event
                        aScore
                        aTcode
                        aTname
                        aTshortName
                        date
                        hScore
                        hTcode
                        hTname
                        hTshortName
                        status
                    }
                }
            }
        }
    `);
    return new GameWeeks(gw);
};

export default useGameWeeks;
