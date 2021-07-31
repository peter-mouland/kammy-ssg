/* eslint-disable react/no-danger */
import { graphql, useStaticQuery } from 'gatsby';
import parseISO from 'date-fns/parseISO';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const getGameWeekFromDateFact = (gameWeeks) => (date) => {
    const gwIndex = gameWeeks.findIndex(({ start, end }) => inDateRange({ start, end }, date));
    return gwIndex < 0 ? 1 : gwIndex;
};

const useGameWeeks = () => {
    const {
        allGameWeeks: { nodes: gw },
    } = useStaticQuery(graphql`
        query GameWeeks {
            allGameWeeks(sort: { fields: gameWeek, order: ASC }) {
                nodes {
                    gameWeek
                    isCurrent
                    cup
                    start
                    end
                    notes
                    startFromNow: start(fromNow: true)
                    endFromNow: end(fromNow: true)
                    #                    fixtures {
                    #                        aScore
                    #                        aTcode
                    #                        aTname
                    #                        date
                    #                        hScore
                    #                        hTcode
                    #                        hTname
                    #                        status
                    #                    }
                }
            }
        }
    `);
    const gameWeeks = gw.map((gm) => ({
        ...gm,
        start: new Date(gm.start),
        end: new Date(gm.end),
    }));
    const getGameWeekFromDate = getGameWeekFromDateFact(gameWeeks);
    const currentGameWeekIndex = gameWeeks.findIndex(({ isCurrent }) => !!isCurrent);
    const currentGameWeek = gameWeeks[currentGameWeekIndex];
    const nextGameWeek = gameWeeks[currentGameWeekIndex + 1];
    const previousGameWeek = gameWeeks[currentGameWeekIndex - 1];
    return {
        gameWeeks,
        currentGameWeek,
        nextGameWeek,
        previousGameWeek,
        getGameWeekFromDate,
    };
};

export default useGameWeeks;
