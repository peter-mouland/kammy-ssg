import { graphql, useStaticQuery } from 'gatsby';

const usePlayers = () => {
    const {
        allPlayers: { nodes: players },
    } = useStaticQuery(graphql`
        query TransferPlayers {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    id
                    name
                    club
                    pos
                    new
                    code
                    value
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
    return { players };
};

export default usePlayers;
