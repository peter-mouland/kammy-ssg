import { graphql, useStaticQuery } from 'gatsby';

const useClubs = () => {
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
