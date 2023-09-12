import { graphql, useStaticQuery } from 'gatsby';

import Positions, { Position } from '../models/position';

const useDivisions = () => {
    const data = useStaticQuery(graphql`
        query Positions {
            allPositionCategories(sort: { displayOrder: ASC }) {
                nodes {
                    id
                    categoryId
                    displayOrder
                    label
                }
            }
            allPositions(sort: { displayOrder: ASC }) {
                nodes {
                    id
                    positionId
                    displayOrder
                    label
                    isPlayerPosition
                    category {
                        categoryId
                        label
                    }
                }
            }
        }
    `);
    return new Positions(data.allPositions.nodes, data.allPositionCategories.nodes);
};

export default useDivisions;
export { Positions, Position };
