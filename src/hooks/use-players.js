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
                    avail
                    availStatus
                    availReason
                    availNews
                    season {
                        apps
                        subs
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        pb
                        tb
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
    return { players, playersByName };
};

export default usePlayers;
