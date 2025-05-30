import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { graphql, useStaticQuery } from 'gatsby';
import extract from '@kammy/helpers.extract-fpl-stats';
import { calculateTotalPoints } from '@kammy/helpers.fpl-stats-to-points';

// import json from './test-resources/live-scores.json'

const URL = 'https://kammy-proxy.herokuapp.com/skysports/scores';

const fetchScores = () =>
    fetch(URL)
        .then((response) => (response.json ? response.json() : response))
        .then((response) => response.players);
// .then((response) => json.players); // used for testing

const useLiveScores = () => {
    const queryKey = 'liveStats';
    const [intervalMs] = React.useState(60000);
    const queryClient = useQueryClient();

    const {
        isFetching: isLiveStatsLoading,
        isComplete,
        data: liveStats = [],
    } = useQuery({ queryKey, queryFn: fetchScores, refetchInterval: intervalMs });

    if (isComplete) {
        queryClient.invalidateQueries(queryKey);
    }

    const {
        allPlayers: { nodes: players },
    } = useStaticQuery(graphql`
        query PlayerCodes {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    positionId
                    code
                    name
                }
            }
        }
    `);

    const playerByCode = players.reduce((prev, player) => ({ ...prev, [player.code]: player }), {});
    const liveStatsByCode = liveStats.reduce((prev, player) => {
        const stats = extract(player, { isLive: true });
        if (!playerByCode[player[0]]) {
            // eslint-disable-next-line no-console
            console.error(`player ${player[0]} is not in our list`);
            return prev;
        }
        const { pos } = playerByCode[player[0]];
        const points = calculateTotalPoints({ stats, pos });
        // only show stats for those that can score points
        const posStats = Object.keys(stats).reduce(
            (prevPosStat, stat) => ({
                ...prevPosStat,
                [stat]: calculateTotalPoints({ stats: { [stat]: 9 }, pos }).total !== 0 ? stats[stat] : null,
            }),
            {},
        );
        const livePlayerStats = {
            ...posStats,
            points: points.total,
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
