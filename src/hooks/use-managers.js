import { graphql, useStaticQuery } from 'gatsby';

import CManagers from '../models/managers';

const useManagers = () => {
    const {
        allManagers: { nodes: managers },
    } = useStaticQuery(graphql`
        query managers {
            allManagers(sort: { division: { order: ASC } }) {
                nodes {
                    label
                    managerId
                    url
                    divisionId
                }
            }
        }
    `);
    return new CManagers(managers);
};

export default useManagers;
