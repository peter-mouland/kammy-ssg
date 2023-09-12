import { graphql, useStaticQuery } from 'gatsby';

import Divisions, { Division } from '../models/division';

const useDivisions = () => {
    const data = useStaticQuery(graphql`
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
    return new Divisions(data.allDivisions.nodes);
};

export default useDivisions;
export { Divisions, Division };
