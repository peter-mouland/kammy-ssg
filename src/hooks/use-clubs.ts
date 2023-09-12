import { graphql, useStaticQuery } from 'gatsby';

export type Club = string;
const useClubs = (): [Club] => {
    const {
        allClubs: { clubs },
    } = useStaticQuery(graphql`
        query Clubs {
            allClubs: allPlayers {
                clubs: distinct(field: { club: SELECT })
            }
        }
    `);
    return clubs;
};

export default useClubs;
