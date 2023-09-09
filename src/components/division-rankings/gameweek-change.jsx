import React from 'react';
import PropTypes from 'prop-types';

import * as DivisionRankings from './index';

export const GameWeekChange = ({ Positions, Standings, Managers }) => (
    <DivisionRankings.Table>
        <DivisionRankings.Thead>
            <DivisionRankings.Th />
            {Positions.PositionCategories.map((Position) => (
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
                    {Positions.PositionCategories.map((Position) => (
                        <DivisionRankings.TdPair
                            key={Position.id}
                            rank={Standing[Position.id].rankChange}
                            point={Standing[Position.id].gameWeekPoints}
                        />
                    ))}
                    <DivisionRankings.Td>{Standing.total.rankChange}</DivisionRankings.Td>
                    <DivisionRankings.Td small>{Standing.total.gameWeekPoints}</DivisionRankings.Td>
                </DivisionRankings.Tr>
            ))}
        </DivisionRankings.Tbody>
    </DivisionRankings.Table>
);

GameWeekChange.propTypes = {
    gameWeekDates: PropTypes.object,
    Standings: PropTypes.array,
    Divisions: PropTypes.array,
};

GameWeekChange.defaultProps = {
    Standings: [],
    Divisions: [],
    gameWeekDates: null,
};
