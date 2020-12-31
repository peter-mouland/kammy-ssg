/* eslint-disable react/prop-types */
import React from 'react';
import { maxSwaps, consts } from '@kammy/helpers.squad-rules';

import Player from '../../../player';
import Accordion from '../accordion';

const TYPE = consts.changeTypes.SWAP;
const SUB = 'SUB';

const getValidPlayersToSwap = ({ team }) => {
    const sub = team.find(({ teamPos }) => teamPos === SUB);
    const selectedPlayers = team.filter(({ isSelected }) => isSelected);
    const hasSelectedSub = selectedPlayers.find(({ teamPos }) => teamPos === SUB);
    const possibleSquadSubs = team.filter(({ player, teamPos }) => player.pos === sub.player.pos && teamPos !== SUB);
    const possibleSelectedSubs = selectedPlayers.filter(
        ({ player, teamPos }) => player.pos === sub.pos && teamPos !== SUB,
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
    const selectedPlayers = team.filter(({ isSelected }) => !!isSelected);
    const sub = team.find(({ teamPos }) => teamPos === SUB);
    const recommendPlayersToShow = getValidPlayersToSwap({ team });
    const maxSwapsRules = maxSwaps({ managerSwaps: swaps });

    return (
        <Accordion
            title="Swap"
            count={recommendPlayersToShow.length}
            highlights={[
                <p>
                    Player leaving: <strong>{sub.player.name}</strong>
                </p>,
            ]}
            rules={maxSwapsRules}
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
                                <td>{player.season?.points}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            applyChange({
                                                type: TYPE,
                                                teamPos: SUB,
                                                player,
                                                posIndex: sub.posIndex,
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
