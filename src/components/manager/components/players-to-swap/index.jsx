/* eslint-disable react/prop-types */
import React from 'react';
import { swapCountLimit, changeTypes } from '@kammy/helpers.squad-rules';

import Player from '../../../player';
import Accordion from '../accordion';

const TYPE = changeTypes.SWAP;
const SUB = 'sub';

const getValidPlayersToSwap = ({ team }) => {
    const sub = team.players.find(({ squadPositionId }) => squadPositionId === SUB);
    const selectedPlayers = team.players.filter(({ isSelected }) => isSelected);
    const hasSelectedSub = selectedPlayers.find(({ squadPositionId }) => squadPositionId === SUB);
    const possibleSquadSubs = team.players.filter(
        ({ positionId, squadPositionId }) => positionId === sub.positionId && squadPositionId !== SUB,
    );
    const possibleSelectedSubs = selectedPlayers.filter(
        ({ positionId, squadPositionId }) => positionId === sub.positionId && squadPositionId !== SUB,
    );
    switch (true) {
        case Boolean(hasSelectedSub):
            return possibleSquadSubs;
        case possibleSelectedSubs.length > 0:
            return possibleSelectedSubs;
        default:
            return [];
    }
};

const PlayersToSwap = ({ team, swaps, applyChange }) => {
    const selectedPlayers = team.players.filter(({ isSelected }) => !!isSelected);
    const sub = team.players.find(({ squadPositionId }) => squadPositionId === SUB);
    const recommendPlayersToShow = getValidPlayersToSwap({ team });
    // const maxSwapsRules = swapCountLimit({ managerSwaps: swaps });

    return (
        <Accordion
            title="Swap"
            count={recommendPlayersToShow.length}
            highlights={[
                <p>
                    Player leaving: <strong>{sub.name}</strong>
                </p>,
            ]}
            rules={{}}
            // rules={maxSwapsRules}
        >
            <table>
                <thead>
                    <tr>
                        <th>Player In</th>
                        <th>Points</th>
                        <th aria-label="action" />
                    </tr>
                </thead>
                <tbody>
                    {selectedPlayers.length === 0 ? (
                        <tr>
                            <td>
                                <em>please select one or more players</em>
                            </td>
                        </tr>
                    ) : (
                        recommendPlayersToShow.map(({ player }) => (
                            <tr key={player.name}>
                                <td>
                                    <Player player={player} small />
                                </td>
                                <td>{player.seasonStats?.points}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            applyChange({
                                                type: TYPE,
                                                squadPositionId: SUB,
                                                player,
                                                squadPositionIndex: sub.squadPositionIndex,
                                            })
                                        }
                                    >
                                        Swap Player
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        {selectedPlayers.length > 0 && recommendPlayersToShow.length === 0 ? (
                            <td>
                                <em>no valid player selected</em>
                            </td>
                        ) : null}
                    </tr>
                </tfoot>
            </table>
        </Accordion>
    );
};
export default PlayersToSwap;
