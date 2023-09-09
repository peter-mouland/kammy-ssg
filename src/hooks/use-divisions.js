import { graphql, useStaticQuery } from 'gatsby';

const useDivisions = () => {
    const {
        allDivisions: { nodes: divisions },
    } = useStaticQuery(graphql`
        query Divisions {
            allDivisions(sort: { order: ASC }) {
                nodes {
                    divisionId
                    label
                    url
                    order
                }
            }
        }
    `);
    return { divisions };
};

export default useDivisions;
