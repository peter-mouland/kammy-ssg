import { graphql, useStaticQuery } from 'gatsby';

import { Players } from '../models/players';

const usePlayers = () => {
    const {
        allPlayers: { nodes: players },
    } = useStaticQuery(graphql`
        query Players {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    url
                    name
                    club
                    positionId
                    new
                    code
                    form
                    seasonStats {
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
    return new Players(players);
};

export default usePlayers;
