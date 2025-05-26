import * as React from 'react'
import PropTypes from 'prop-types';

import * as DivisionRankings from './index';

export const SeasonTotals = ({ Positions, Standings, Managers }) => (
    <DivisionRankings.Table>
        <DivisionRankings.Thead>
            <DivisionRankings.Th />
            {Positions.positionCategories.map((Position) => (
                <DivisionRankings.Th key={Position.id} colSpan={2}>
                    {Position.label}
                </DivisionRankings.Th>
            ))}
            <DivisionRankings.Th colSpan={2}>Total</DivisionRankings.Th>
        </DivisionRankings.Thead>
        <DivisionRankings.Tbody>
            {Standings.map((Standing) => (
                <DivisionRankings.Tr key={Managers.byId[Standing.managerId].id}>
                    <DivisionRankings.Td>{Managers.byId[Standing.managerId].label}</DivisionRankings.Td>
                    {Positions.positionCategories.map((Position) => (
                        <DivisionRankings.TdPair
                            key={Position.id}
                            rank={Standing[Position.id].rank}
                            point={Standing[Position.id].seasonPoints}
                        />
                    ))}
                    <DivisionRankings.Td>{Standing.total.rank}</DivisionRankings.Td>
                    <DivisionRankings.Td small>{Standing.total.seasonPoints}</DivisionRankings.Td>
                </DivisionRankings.Tr>
            ))}
        </DivisionRankings.Tbody>
    </DivisionRankings.Table>
);

SeasonTotals.propTypes = {
    Standings: PropTypes.array,
};

SeasonTotals.defaultProps = {
    Standings: [],
};
