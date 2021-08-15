import { useMemo } from 'react';
import { graphql, useStaticQuery } from 'gatsby';

const usePlayers = () => {
    const {
        allPlayers: { nodes: players },
    } = useStaticQuery(graphql`
        query Players {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    id
                    url
                    name: web_name
                    club
                    pos
                    new
                    code
                    value: value_season
                    isAvailable
                    availNews
                    season {
                        apps
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        bp
                        sb
                        points
                    }
                }
            }
        }
    `);
    const playersByName = useMemo(
        () => players.reduce((prev, player) => ({ ...prev, [player.name]: player }), {}),
        [players],
    );
    const playersByCode = useMemo(
        () => players.reduce((prev, player) => ({ ...prev, [player.code]: player }), {}),
        [players],
    );
    return { players, playersByName, playersByCode };
};

export default usePlayers;
