import * as React from 'react'
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import { getSquadWarnings, changeTypes } from '@kammy/helpers.squad-rules';

import usePlayers from '../../../hooks/use-players';
import Spacer from '../../spacer';
import Drawer from '../../drawer';
import MultiToggle from '../../multi-toggle';
import Button from '../../button';
import Accordion from '../../accordion';
import Player from '../../player';
import TransferWarnings from '../transfer-warnings';
import Search from './search';
import './transferPage.css';
import CPositions from '../../../models/position';
import { useMutateTransfersSheet } from '../../../hooks/use-google-transfers';
import usePositions from '../../../hooks/use-positions';

const bem = bemHelper({ block: 'transfers-page' });
const PLAYER_IN = 'playerIn';
const PLAYER_OUT = 'playerOut';

const confirmTransfer = async ({ squads, transfers, divisionId, saveSquadChange, reset }) => {
    const data = transfers.map((changeState) => {
        const squad = squads.byManagerId[changeState.managerId];
        return {
            timestamp: new Date(),
            Status: 'TBC',
            isPending: true,
            type: changeState.type,
            managerId: changeState.managerId,
            playerIn: changeState.playerIn,
            playerOut: changeState.playerOut,
            transferIn: changeState.playerIn ? changeState.playerIn.name : '',
            transferOut: changeState.playerOut ? changeState.playerOut.name : '',
            codeIn: changeState.playerIn ? changeState.playerIn.code : '',
            codeOut: changeState.playerOut ? changeState.playerOut.code : '',
            comment: changeState.comment,
            Comment: changeState.comment,
            warnings: changeState.warnings,
            Division: divisionId,
            Manager: squad.manager.label,
            'Transfer Type': changeState.type,
            'Transfer In': changeState.playerIn.name,
            'Transfer Out': changeState.playerOut.name,
            'Code In': changeState.playerIn.code,
            'Code Out': changeState.playerOut.code,
        };
    });

    await saveSquadChange({ division: divisionId, data });
    reset();
};

const createPositionFilter = (selectedPlayer) =>
    selectedPlayer
        ? { value: selectedPlayer.positionId, label: selectedPlayer.positionId.toUpperCase(), group: 'position' }
        : null;

const getPlayerRequestConfig = (
    { type, managerId, selectedPlayer, playerIn, playerOut },
    { players, teamsByManager },
) => {
    switch (true) {
        case type === changeTypes.SWAP: {
            const sub =
                (teamsByManager[managerId] &&
                    teamsByManager[managerId].players.find(({ squadPositionId }) => squadPositionId === 'sub')) ||
                {};
            const preselect = players.all.find(({ code }) => code === sub.code);
            return {
                out: {
                    players,
                    defaultFilter: [
                        { value: managerId, label: `${managerId}*`, group: 'manager' },
                        createPositionFilter(preselect),
                    ].filter(Boolean),
                    buttonText: 'your new SUB',
                    searchText: (
                        <span>
                            Players moving into your SUB position must either be in your team (excluding your current
                            SUB) or part of a pending transfer.
                        </span>
                    ),
                },
                in: {
                    preselect,
                    players,
                    defaultFilter: [
                        { value: managerId, label: `${managerId}*`, group: 'manager' },
                        { value: 'isSub', label: 'Sub(s)', group: 'misc' },
                        createPositionFilter(preselect),
                    ].filter(Boolean),
                    buttonText: 'player leaving SUB',
                    searchText: (
                        <span>
                            You can only swap out your current SUB or a player replacing him as part of a pending
                            transfer.
                        </span>
                    ),
                },
            };
        }
        case type === changeTypes.NEW_PLAYER: {
            return {
                out: {
                    players,
                    defaultFilter: [
                        { value: managerId, label: `${managerId}*`, group: 'manager' },
                        createPositionFilter(selectedPlayer),
                    ].filter(Boolean),
                    searchText: <span>You can only drop a player currently in your team (or a pending transfer).</span>,
                    buttonText: 'Player Leaving',
                },
                in: {
                    players,
                    defaultFilter: [
                        { value: 'isNew', label: 'New Players', group: 'misc' },
                        createPositionFilter(selectedPlayer),
                    ].filter(Boolean),
                    buttonText: 'Player Arriving',
                    message: <span>Select from the list of new players here.</span>,
                },
            };
        }
        default: {
            return {
                out: {
                    players,
                    defaultFilter: [
                        { value: managerId, label: `${managerId}*`, group: 'manager' },
                        createPositionFilter(playerIn),
                    ].filter(Boolean),
                    searchText: null,
                    buttonText: 'Player Leaving',
                },
                in: {
                    players,
                    defaultFilter: [
                        playerOut?.squadPositionId === 'sub' ? false : createPositionFilter(playerOut),
                    ].filter(Boolean),
                    searchText: null,
                    buttonText: 'Player Arriving',
                },
            };
        }
    }
};

const initialChangeState = {
    type: null,
    managerId: null,
    comment: null,
    playerIn: null,
    playerOut: null,
    isPending: true,
    drawerType: null,
    selectedPlayer: null,
};

const changeReducerFactory = (divisionData) => {
    const changeReducer = (state, action) => {
        switch (action.type) {
            case 'SET_MANAGER':
                return {
                    ...initialChangeState,
                    managerId: action.data,
                };
            case 'SET_TYPE': {
                const config = getPlayerRequestConfig({ ...state, type: action.data }, divisionData);
                return {
                    ...state,
                    playerIn: config.in?.preselect,
                    playerOut: null,
                    type: action.data,
                };
            }
            case 'OPEN_PLAYER_OUT_DRAWER': {
                return {
                    ...state,
                    drawerType: PLAYER_OUT,
                    selectedPlayer: state.playerIn,
                };
            }
            case 'OPEN_PLAYER_IN_DRAWER': {
                return {
                    ...state,
                    drawerType: PLAYER_IN,
                    selectedPlayer: state.playerOut,
                };
            }
            case 'SET_PLAYER_IN': {
                const closeDrawerState = changeReducer(state, { type: 'CLOSE_DRAWER' });
                // console.log('SET_PLAYER_IN', { state, closeDrawerState });
                return { ...closeDrawerState, playerIn: action.player };
            }
            case 'SET_PLAYER_OUT': {
                const closeDrawerState = changeReducer(state, { type: 'CLOSE_DRAWER' });
                // console.log('SET_PLAYER_OUT', { state, closeDrawerState });
                return { ...closeDrawerState, playerOut: action.player };
            }
            case 'SET_COMMENT':
                return {
                    ...state,
                    comment: action.data,
                };
            case 'CLOSE_DRAWER':
                return {
                    ...state,
                    selectedPlayer: null,
                    drawerType: null,
                    search: null,
                };
            case 'RESET':
                return initialChangeState;
            default:
                return state;
        }
    };
    return changeReducer;
};

const TransfersRequests = ({ divisionId, teamsByManager, managersList, transfers, squads }) => {
    const { isPending, mutate: saveSquadChange } = useMutateTransfersSheet({ divisionId });
    const Positions = usePositions();
    const players = usePlayers();
    const changeReducer = changeReducerFactory({ transfers, players, teamsByManager });
    const [changeState, dispatchChange] = React.useReducer(changeReducer, initialChangeState);
    const { warnings } = getSquadWarnings(changeState, { transfers, players, teamsByManager }) || {};
    const config = getPlayerRequestConfig(changeState, { players, teamsByManager });

    const search =
        changeState.drawerType === PLAYER_OUT
            ? {
                  defaultFilter: config.out.defaultFilter,
                  players: config.out.players,
                  searchText: config.out.searchText,
                  onSelectType: 'SET_PLAYER_OUT',
              }
            : changeState.drawerType === PLAYER_IN
            ? {
                  defaultFilter: config.in.defaultFilter,
                  players: config.in.players,
                  searchText: config.in.searchText,
                  onSelectType: 'SET_PLAYER_IN',
              }
            : {};

    return (
        <div className={bem(null, null, 'page-content')}>
            <Drawer
                isCloseable
                hasBackdrop
                onClose={() => dispatchChange({ type: 'CLOSE_DRAWER' })}
                isOpen={!!changeState.drawerType}
                placement={Drawer.placements.RIGHT}
                theme={Drawer.themes.LIGHT}
            >
                {changeState.drawerType ? (
                    <Search
                        positions={Positions}
                        managers={managersList}
                        managerId={changeState.managerId}
                        teams={teamsByManager}
                        defaultFilter={search.defaultFilter}
                        players={search.players}
                        searchText={search.searchText}
                        onSelect={(player) => dispatchChange({ type: search.onSelectType, player })}
                        transfers={transfers}
                    />
                ) : null}
            </Drawer>
            <Accordion
                title="Create Request"
                description="Initiate a Transfer, Loan, Swap or Trade"
                type={Accordion.types.SECONDARY}
            >
                <Accordion.Content>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        <h3>Who are you?</h3>
                    </Spacer>
                    <MultiToggle
                        id="manager"
                        loadingMessage="loading teams..."
                        options={managersList}
                        checked={changeState.managerId}
                        onChange={(selectedId) => dispatchChange({ type: 'SET_MANAGER', data: selectedId })}
                    />
                </Accordion.Content>
                {changeState.managerId && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>What type of request is it?</h3>
                        </Spacer>
                        <MultiToggle
                            id="change-type"
                            options={Object.values(changeTypes)}
                            checked={changeState.type}
                            onChange={(type) => dispatchChange({ type: 'SET_TYPE', data: type })}
                        />
                    </Accordion.Content>
                )}

                {changeState.type && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            <h3>How is your squad changing?</h3>
                        </Spacer>

                        <Spacer all={{ bottom: Spacer.spacings.TINY }} className={bem('player-cta')}>
                            <Spacer all={{ right: Spacer.spacings.SMALL }}>
                                <span className={bem('player-cta-button')}>
                                    <Button onClick={() => dispatchChange({ type: 'OPEN_PLAYER_OUT_DRAWER' })}>
                                        {changeState.playerOut ? 'Change ' : 'Pick '} {config.out.buttonText}
                                    </Button>
                                </span>
                            </Spacer>
                            <span className={bem('player-cta-label')}>
                                {changeState.playerOut && (
                                    <Player
                                        player={players.byCode[changeState.playerOut.code]}
                                        squadPositionId={changeState.playerOut.squadPositionId}
                                    />
                                )}
                            </span>
                        </Spacer>

                        <Spacer all={{ bottom: Spacer.spacings.TINY }} className={bem('player-cta')}>
                            <Spacer all={{ right: Spacer.spacings.SMALL }}>
                                <span className={bem('player-cta-button')}>
                                    <Button onClick={() => dispatchChange({ type: 'OPEN_PLAYER_IN_DRAWER' })}>
                                        {changeState.playerIn ? 'Change ' : 'Pick '} {config.in.buttonText}
                                    </Button>
                                </span>
                            </Spacer>
                            <span className={bem('player-cta-label')}>
                                {changeState.playerIn && (
                                    <Player
                                        player={players.byCode[changeState.playerIn.code]}
                                        squadPositionId={changeState.playerIn.squadPositionId}
                                    />
                                )}
                            </span>
                        </Spacer>
                        {warnings.length > 0 ? (
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                                <TransferWarnings warnings={warnings} />
                            </Spacer>
                        ) : null}
                    </Accordion.Content>
                )}

                {changeState.playerIn && changeState.playerOut && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>Any Comments for the banter box?</h3>
                        </Spacer>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <textarea
                                className="transfers-page__comment"
                                onChange={(e) => dispatchChange({ type: 'SET_COMMENT', data: e.currentTarget.value })}
                            />
                        </Spacer>
                    </Accordion.Content>
                )}

                {changeState.playerIn && changeState.playerOut && (
                    <Accordion.Content>
                        <Button
                            onClick={() =>
                                confirmTransfer({
                                    transfers: [changeState],
                                    divisionId,
                                    squads,
                                    saveSquadChange,
                                    reset: () => dispatchChange({ type: 'RESET' }),
                                })
                            }
                            state="buttonState"
                            isLoading={isPending}
                        >
                            Submit Request
                        </Button>
                    </Accordion.Content>
                )}
            </Accordion>
        </div>
    );
};

TransfersRequests.propTypes = {
    divisionId: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
    isLoading: PropTypes.bool,
};

TransfersRequests.defaultProps = {
    isLoading: false,
    teamsByManager: {},
};

export default TransfersRequests;
