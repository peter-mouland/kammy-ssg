import { graphql, useStaticQuery } from 'gatsby';

const useManagers = () => {
    const {
        allManagers: { nodes: managers },
    } = useStaticQuery(graphql`
        query managers {
            allManagers(sort: { fields: division___order }) {
                nodes {
                    manager
                    divisionKey
                    division {
                        key
                        label
                        order
                    }
                }
            }
        }
    `);
    const getManagersFromDivision = (divisionKey) =>
        managers.filter(({ divisionKey: div }) => div === divisionKey).map(({ manager }) => manager);
    const managerNames = managers.map(({ manager }) => manager).sort();
    return { managers, getManagersFromDivision, managerNames };
};

export default useManagers;
