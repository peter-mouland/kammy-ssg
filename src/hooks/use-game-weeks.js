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
        allGameWeeks: { nodes: gameWeeks },
    } = useStaticQuery(graphql`
        query GameWeeks {
            allGameWeeks(sort: { fields: gameWeek, order: ASC }) {
                nodes {
                    gameWeek
                    isCurrent
                    cup
                    start
                    end
                    startFromNow: start(fromNow: true)
                    endFromNow: end(fromNow: true)
                }
            }
        }
    `);
    const getGameWeekFromDate = getGameWeekFromDateFact(gameWeeks);
    const currentGameWeek = gameWeeks.find(({ isCurrent }) => !!isCurrent);
    return {
        gameWeeks,
        currentGameWeek,
        getGameWeekFromDate,
    };
};

export default useGameWeeks;
