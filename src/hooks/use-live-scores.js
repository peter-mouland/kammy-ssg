/* global fetch */
import { useQuery } from 'react-query';
import extract from '@kammy/helpers.extract-sky-sports-stats';

const URL = 'https://kammy-proxy.herokuapp.com/skysports/scores';

const fetchScores = () =>
    fetch(URL)
        .then((response) => (response.json ? response.json() : response))
        .then((response) => response.players);

const useLiveScores = () => {
    const { isLoading: isSkyScoresLoading, data: skyScores = [] } = useQuery('liveScores', fetchScores);
    const skyScoresByCode = skyScores.reduce((prev, player) => {
        const stats = extract(player.slice(1, player.length));
        return {
            ...prev,
            [player[0]]: {
                raw: player,
                stats,
            },
        };
    }, {});
    console.log({skyScoresByCode})
    return {
        skyScores,
        skyScoresByCode,
        isSkyScoresLoading,
    };
};

export default useLiveScores;
