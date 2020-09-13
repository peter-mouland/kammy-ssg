/* global fetch */
import { useQuery } from 'react-query';
import { graphql, useStaticQuery } from 'gatsby';
import extract from '@kammy/helpers.extract-sky-sports-stats';
import { calculateTotalPoints } from '@kammy/helpers.sky-sports-stats-to-points';

// import json from './test-resources/live-scores.json'

const URL = 'https://kammy-proxy.herokuapp.com/skysports/scores';

const fetchScores = () =>
    fetch(URL)
        .then((response) => (response.json ? response.json() : response))
        .then((response) => response.players);
// .then((response) => json.players); // used for testing

const useLiveScores = () => {
    const { isLoading: isLiveStatsLoading, data: liveStats = [] } = useQuery('liveStats', fetchScores);
    const {
        allPlayers: { nodes: players },
    } = useStaticQuery(graphql`
        query PlayerCodes {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    pos
                    code
                    name
                }
            }
        }
    `);

    const playerByCode = players.reduce((prev, player) => ({ ...prev, [player.code]: player }), {});
    const liveStatsByCode = liveStats.reduce((prev, player) => {
        const stats = extract(player, { isLive: true });
        const livePlayerStats = {
            ...stats,
            points: calculateTotalPoints({ stats, pos: playerByCode[player[0]].pos }).total,
        };
        return {
            ...prev,
            [player[0]]: livePlayerStats,
        };
    }, {});

    return {
        liveStats,
        liveStatsByCode,
        isLiveStatsLoading,
    };
};

export default useLiveScores;
