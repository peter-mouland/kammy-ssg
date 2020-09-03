import { graphql, useStaticQuery } from 'gatsby';

const useDivisions = () => {
    const {
        allDivisions: { nodes: divisions },
    } = useStaticQuery(graphql`
        query Divisions {
            allDivisions(sort: { fields: order }) {
                nodes {
                    key
                    label
                    order
                }
            }
        }
    `);
    return { divisions };
};

export default useDivisions;
