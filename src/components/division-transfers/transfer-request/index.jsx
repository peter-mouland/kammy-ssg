import React, { useState } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import { getSquadWarnings, consts } from '@kammy/helpers.squad-rules';

import usePlayers from '../../../hooks/use-players';
import Spacer from '../../spacer';
import Drawer from '../../drawer';
import MultiToggle from '../../multi-toggle';
import Button from '../../button';
import Accordion from '../../accordion';
import Player from '../../player';
import TransferWarnings from '../transfer-warnings';
import Search from './search';
import './transferPage.scss';

const { changeTypes } = consts;
const bem = bemHelper({ block: 'transfers-page' });
const drawerInitialState = undefined;
const PLAYER_IN = 'playerIn';
const PLAYER_OUT = 'playerOut';

const confirmTransfer = async ({ transfers, divisionKey, saveSquadChange, reset }) => {
    const data = transfers.map(({ type, playerIn, playerOut, comment, manager, ...transfer }) => ({
        ...transfer,
        type,
        manager,
        Division: divisionKey,
        Manager: manager,
        Status: 'TBC',
        isPending: true,
        'Transfer Type': type,
        'Transfer In': playerIn.name,
        'Transfer Out': playerOut.name,
        'Code In': playerIn.code,
        'Code Out': playerOut.code,
        Comment: comment,
    }));

    await saveSquadChange({ division: divisionKey, data });
    reset();
};

const getPlayerRequestConfig = ({ teamsByManager, playersArray, changeType, manager, selectedPlayer, playerOut }) => {
    const positionFilter = selectedPlayer
        ? { value: selectedPlayer.pos, label: selectedPlayer.pos, group: 'position' }
        : null;
    switch (true) {
        case changeType === changeTypes.SWAP: {
            const sub =
                (teamsByManager[manager] && teamsByManager[manager].find(({ teamPos }) => teamPos === 'SUB')) || {};
            return {
                out: {
                    players: playersArray,
                    defaultFilter: [{ value: manager, label: `${manager}*`, group: 'manager' }, positionFilter].filter(
                        Boolean,
                    ),
                    buttonText: 'your new SUB',
                    searchText: (
                        <span>
                            Players moving into your SUB position must either be in your team (excluding your current
                            SUB) or part of a pending transfer.
                        </span>
                    ),
                },
                in: {
                    preselect: sub.player,
                    players: playersArray,
                    defaultFilter: [
                        { value: manager, label: `${manager}*`, group: 'manager' },
                        { value: 'isSub', label: 'Sub(s)', group: 'misc' },
                        positionFilter,
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
        case changeType === changeTypes.NEW_PLAYER: {
            return {
                out: {
                    players: playersArray,
                    defaultFilter: [{ value: manager, label: `${manager}*`, group: 'manager' }, positionFilter].filter(
                        Boolean,
                    ),
                    searchText: <span>You can only drop a player currently in your team (or a pending transfer).</span>,
                    buttonText: 'Player Leaving',
                },
                in: {
                    players: playersArray,
                    defaultFilter: [{ value: 'isNew', label: 'New Players', group: 'misc' }, positionFilter].filter(
                        Boolean,
                    ),
                    buttonText: 'Player Arriving',
                    message: <span>Select from the list of new players here.</span>,
                },
            };
        }
        default: {
            return {
                out: {
                    players: playersArray,
                    defaultFilter: [{ value: manager, label: `${manager}*`, group: 'manager' }, positionFilter].filter(
                        Boolean,
                    ),
                    searchText: null,
                    buttonText: 'Player Leaving',
                },
                in: {
                    players: playersArray,
                    defaultFilter: [playerOut?.teamPos === 'SUB' ? false : positionFilter].filter(Boolean),
                    searchText: null,
                    buttonText: 'Player Arriving',
                },
            };
        }
    }
};

const TransfersRequests = ({
    divisionKey,
    teamsByManager,
    managers,
    isLoading,
    saveSquadChange,
    transfers,
    playersByCode,
}) => {
    const { players: playersArray } = usePlayers();
    const [drawerContent, setDrawerContent] = useState(drawerInitialState);
    const [changeType, setChangeType] = useState(undefined);
    const [manager, setManager] = useState(undefined);
    const [comment, setComment] = useState('');
    const [playerIn, setPlayerIn] = useState(undefined);
    const [playerOut, setPlayerOut] = useState(undefined);
    const selectedPlayer = drawerContent === PLAYER_IN ? playerOut : playerIn;
    const playerRequestConfig = getPlayerRequestConfig({
        teamsByManager,
        playersArray,
        changeType,
        manager,
        selectedPlayer,
        playerOut,
    });
    const { warnings } =
        getSquadWarnings({ playerIn, playerOut, teams: teamsByManager, manager, changeType, transfers }) || {};

    const openSearch = (playerChangeType) => {
        setDrawerContent(playerChangeType);
    };

    const setPlayerOutAndClose = (player) => {
        setDrawerContent(drawerInitialState);
        setPlayerOut(player);
    };
    const setPlayerInAndClose = (player) => {
        setDrawerContent(drawerInitialState);
        setPlayerIn(player);
    };

    const changeRequestType = (type) => {
        // get up to date config for new changeType
        const config = getPlayerRequestConfig({
            teamsByManager,
            playersArray,
            changeType: type,
            manager,
            selectedPlayer,
        });
        setPlayerIn(config.in?.preselect);
        setPlayerOut(undefined);
        setChangeType(type);
    };

    const reset = () => {
        setComment('');
        setChangeType(undefined);
        setPlayerIn(undefined);
        setPlayerOut(undefined);
    };

    const RequestPlayerOut = () => (
        <Search
            managers={managers}
            manager={manager}
            teams={teamsByManager}
            defaultFilter={playerRequestConfig.out.defaultFilter}
            playersArray={playerRequestConfig.out.players}
            searchText={playerRequestConfig.out.searchText}
            onSelect={setPlayerOutAndClose}
            transfers={transfers}
        />
    );
    const RequestPlayerIn = () => (
        <Search
            managers={managers}
            manager={manager}
            teams={teamsByManager}
            defaultFilter={playerRequestConfig.in.defaultFilter}
            playersArray={playerRequestConfig.in.players}
            searchText={playerRequestConfig.in.searchText}
            onSelect={setPlayerInAndClose}
            transfers={transfers}
        />
    );

    return (
        <div className={bem(null, null, 'page-content')}>
            <Drawer
                isCloseable
                hasBackdrop
                onClose={() => setDrawerContent(drawerInitialState)}
                isOpen={!!drawerContent}
                placement={Drawer.placements.RIGHT}
                theme={Drawer.themes.LIGHT}
            >
                {drawerContent === PLAYER_IN && <RequestPlayerIn />}
                {drawerContent === PLAYER_OUT && <RequestPlayerOut />}
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
                        options={managers}
                        checked={manager}
                        onChange={setManager}
                    />
                </Accordion.Content>
                {manager && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>What type of request is it?</h3>
                        </Spacer>
                        <MultiToggle
                            id="change-type"
                            options={Object.values(changeTypes)}
                            checked={changeType}
                            onChange={changeRequestType}
                        />
                    </Accordion.Content>
                )}

                {changeType && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            <h3>How is your squad changing?</h3>
                        </Spacer>

                        <Spacer all={{ bottom: Spacer.spacings.TINY }} className={bem('player-cta')}>
                            <Spacer all={{ right: Spacer.spacings.SMALL }}>
                                <span className={bem('player-cta-button')}>
                                    <Button onClick={() => openSearch(PLAYER_OUT)}>
                                        {playerOut ? 'Change ' : 'Pick '} {playerRequestConfig.out.buttonText}
                                    </Button>
                                </span>
                            </Spacer>
                            <span className={bem('player-cta-label')}>
                                {playerOut && (
                                    <Player player={playersByCode[playerOut.code]} teamPos={playerOut.teamPos} />
                                )}
                            </span>
                        </Spacer>

                        <Spacer all={{ bottom: Spacer.spacings.TINY }} className={bem('player-cta')}>
                            <Spacer all={{ right: Spacer.spacings.SMALL }}>
                                <span className={bem('player-cta-button')}>
                                    <Button onClick={() => openSearch(PLAYER_IN)}>
                                        {playerIn ? 'Change ' : 'Pick '} {playerRequestConfig.in.buttonText}
                                    </Button>
                                </span>
                            </Spacer>
                            <span className={bem('player-cta-label')}>
                                {playerIn && (
                                    <Player player={playersByCode[playerIn.code]} teamPos={playerIn.teamPos} />
                                )}
                            </span>
                        </Spacer>
                        {playerIn && playerOut && (
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                                <TransferWarnings warnings={warnings} />
                            </Spacer>
                        )}
                    </Accordion.Content>
                )}

                {playerIn && playerOut && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>Any Comments for the banter box?</h3>
                        </Spacer>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <textarea
                                className="transfers-page__comment"
                                onChange={(e) => setComment(e.currentTarget.value)}
                            />
                        </Spacer>
                    </Accordion.Content>
                )}

                {playerIn && playerOut && (
                    <Accordion.Content>
                        <Button
                            onClick={() =>
                                confirmTransfer({
                                    transfers: [
                                        {
                                            manager,
                                            timestamp: new Date(),
                                            status: 'tbc',
                                            type: changeType,
                                            playerIn,
                                            playerOut,
                                            transferIn: playerIn ? playerIn.name : '',
                                            transferOut: playerOut ? playerOut.name : '',
                                            codeOut: playerIn ? playerIn.code : '',
                                            codeIn: playerOut ? playerOut.code : '',
                                            comment,
                                            warnings,
                                        },
                                    ],
                                    divisionKey,
                                    saveSquadChange,
                                    reset,
                                })
                            }
                            state="buttonState"
                            isLoading={isLoading}
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
    divisionKey: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
    isLoading: PropTypes.bool,
};

TransfersRequests.defaultProps = {
    isLoading: false,
    teamsByManager: {},
};

export default TransfersRequests;
