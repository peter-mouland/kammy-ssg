import React, { useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useMutation } from 'react-query';
import bemHelper from '@kammy/bem';
import { saveTransfers } from '@kammy/helpers.spreadsheet';

import Drawer from '../../drawer';
import MultiToggle from '../../multi-toggle';
import Button from '../../button';
import Accordion from '../../accordion';
import Players from './components/Players';
import GameWeekTransfers from './components/game-week-transfers';
import { changeTypes } from './lib/consts';
import createFilteredPlayers from './lib/create-filtered-players';
import Spacer from '../../spacer';
import './transferPage.scss';

const bem = bemHelper({ block: 'transfers-page' });

// todo: update table on mutation (via react-query)

const confirmTransfer = ({ transfers, division, saveTransfer, reset }) => {
    // if (playerDisplaced && playerGapFiller) {
    //     // rearrange transfer to ensure positions match for the spreadsheet
    //     transfers.push({
    //         ...baseDetails,
    //         'Transfer In': playerGapFiller.value,
    //         'Transfer Out': playerOut.value,
    //         Comment: `${comment} (note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
    //     });
    //     transfers.push({
    //         ...baseDetails,
    //         'Transfer In': playerIn.value,
    //         'Transfer Out': playerDisplaced.value,
    //         Comment: `(note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
    //     });
    //
    const data = transfers.map(({ type, playerIn, playerOut, comment, manager, ...transfer }) => ({
        ...transfer,
        Division: division,
        Manager: manager,
        Status: 'TBC',
        'Transfer Type': type,
        'Transfer In': playerIn.value,
        'Transfer Out': playerOut.value,
        Comment: comment,
    }));

    saveTransfer({ division, data });
    reset();
};

const createFilterOptions = (managers = [], manager) => {
    const positions = [
        { value: 'GK', label: 'GK', group: 'position' },
        { value: 'CB', label: 'CB', group: 'position' },
        { value: 'FB', label: 'FB', group: 'position' },
        { value: 'MID', label: 'MID', group: 'position' },
        { value: 'AM', label: 'AM', group: 'position' },
        { value: 'STR', label: 'STR', group: 'position' },
    ];
    return [
        {
            label: 'Managers',
            options: [
                { value: 'available', label: 'No manager (free agents)', group: 'manager' },
                ...managers.map((mngr) => ({
                    value: mngr,
                    label: `${mngr}${mngr === manager ? '*' : ''}`,
                    group: 'manager',
                })),
            ],
        },
        {
            label: 'Positions',
            options: positions,
        },
    ];
};

const Search = ({ filterOptions, onSelect, onFilter, playersArray, playerFilter, filteredPlayers }) => (
    <Spacer all={{ vertical: Spacer.spacings.HUGE, horizontal: Spacer.spacings.SMALL }}>
        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
            <h3>Search:</h3>
        </Spacer>
        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
            <div style={{ position: 'relative', zIndex: '2' }}>
                <Select
                    value={playerFilter}
                    placeholder="player filter..."
                    options={filterOptions}
                    isMulti
                    name="playersFiltersOut"
                    onChange={onFilter}
                />
            </div>
        </Spacer>
        <div style={{ position: 'relative', zIndex: '1' }}>
            {playersArray.length > 0 && <Players onSelect={onSelect} playersArray={filteredPlayers.sortedPlayers} />}
        </div>
    </Spacer>
);

const TransfersPage = ({ divisionKey, teamsByManager, managers, isLoading }) => {
    const [DrawerContent, setDrawerContent] = useState(undefined);
    const [initiateRequest, setInitiateRequest] = useState(false);
    const [comment, setComment] = useState('');
    const [requestedTransfers, setRequestedTransfers] = useState([]);
    const [manager, setManager] = useState(undefined);
    const [changeType, setChangeType] = useState(undefined);
    const [playerIn, setPlayerIn] = useState(undefined);
    const [playerOut, setPlayerOut] = useState(undefined);
    const [playerFilter, setPlayerFilter] = useState(undefined);
    const [saveTransfer] = useMutation(saveTransfers);
    const filterOptions = createFilterOptions(managers, manager);

    const setPlayerOutAndClose = (player) => {
        setDrawerContent(undefined);
        setPlayerOut(player);
    };
    const setPlayerInAndClose = (player) => {
        setDrawerContent(undefined);
        setPlayerIn(player);
    };

    const reset = () => {
        setComment('');
        setChangeType(undefined);
        setPlayerIn(undefined);
        setPlayerOut(undefined);
        setPlayerFilter(undefined);
        setInitiateRequest(undefined);
    };

    const {
        allPlayers: { nodes: playersArray },
    } = useStaticQuery(graphql`
        query TransferPlayers {
            allPlayers(filter: { isHidden: { eq: false } }) {
                nodes {
                    id
                    name
                    club
                    pos
                    new
                    season {
                        apps
                        subs
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        tb
                        sb
                        points
                    }
                }
            }
        }
    `);

    const filteredPlayers = createFilteredPlayers({
        selectedOptions: playerFilter || [],
        // pendingTransfers: pendingTransfers[manager], // todo
        playersArray,
        team: teamsByManager[manager],
        teams: teamsByManager,
        playerIn,
        playerOut,
    });
    const RequestPlayerOut = () => (
        <Search
            filteredPlayers={filteredPlayers}
            playerFilter={playerFilter}
            filterOptions={filterOptions}
            playersArray={playersArray}
            onFilter={setPlayerFilter}
            onSelect={setPlayerOutAndClose}
        />
    );
    const RequestPlayerIn = () => (
        <Search
            filteredPlayers={filteredPlayers}
            filterOptions={filterOptions}
            playersArray={playersArray}
            onFilter={setPlayerFilter}
            onSelect={setPlayerInAndClose}
        />
    );

    return (
        <div className={bem(null, null, 'page-content')}>
            <Drawer
                isCloseable
                hasBackdrop
                onClose={() => setDrawerContent(undefined)}
                isOpen={!!DrawerContent}
                placement={Drawer.placements.RIGHT}
                theme={Drawer.themes.LIGHT}
            >
                {DrawerContent === 'playerIn' ? <RequestPlayerIn /> : <RequestPlayerOut />}
            </Drawer>
            <Accordion
                title="Create Request"
                description="Initiate a Transfer, Loan, Swap or Trade"
                type={Accordion.types.SECONDARY}
            >
                <Accordion.Content>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        <h4>1. Who are you?</h4>
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
                            <h4>2. What type of request is it?</h4>
                        </Spacer>
                        <MultiToggle
                            id="change-type"
                            options={Object.values(changeTypes)}
                            checked={changeType}
                            onChange={setChangeType}
                        />
                    </Accordion.Content>
                )}

                {manager && changeType && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>3. Who is Leaving the squad?</h3>
                        </Spacer>
                        {playerOut && (
                            <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                                <div>{playerOut.label}</div>
                            </Spacer>
                        )}
                        <Button onClick={() => setDrawerContent('playerOut')}>{playerOut ? 'Change' : 'Pick'}</Button>
                    </Accordion.Content>
                )}

                {manager && changeType && playerOut && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                            <h3>4. Who is Joining the squad?</h3>
                        </Spacer>
                        {playerIn && (
                            <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                                <div>{playerIn.label}</div>
                            </Spacer>
                        )}
                        <Button onClick={() => setDrawerContent('playerIn')}>{playerIn ? 'Change' : 'Pick'}</Button>
                    </Accordion.Content>
                )}

                {manager && changeType && playerOut && playerIn && (
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
                        <Button
                            onClick={() => {
                                requestedTransfers.push({
                                    manager,
                                    timestamp: new Date(),
                                    status: 'tbc',
                                    type: changeType,
                                    playerIn,
                                    playerOut,
                                    transferIn: playerIn ? playerIn.value : '',
                                    transferOut: playerOut ? playerOut.value : '',
                                    comment,
                                });
                                setRequestedTransfers(requestedTransfers);
                                reset();
                            }}
                        >
                            Save Request
                        </Button>
                    </Accordion.Content>
                )}
                {requestedTransfers.length > 0 && (
                    <React.Fragment>
                        <Accordion.Content>
                            <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                                <h3>Pending Requests</h3>
                            </Spacer>
                            <GameWeekTransfers transfers={requestedTransfers} isLoading={false} />
                        </Accordion.Content>

                        <Accordion.Content>
                            <Button
                                onClick={() => {
                                    confirmTransfer({
                                        transfers: requestedTransfers,
                                        division: divisionKey,
                                        saveTransfer,
                                        reset,
                                    });
                                    setRequestedTransfers([]);
                                }}
                                state="buttonState"
                            >
                                Submit Pending Requests
                            </Button>
                        </Accordion.Content>
                    </React.Fragment>
                )}
            </Accordion>
        </div>
    );
};

TransfersPage.propTypes = {
    divisionKey: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
    pendingTransfers: PropTypes.object,
    isLoading: PropTypes.bool,
};

TransfersPage.defaultProps = {
    isLoading: false,
    pendingTransfers: {},
    teamsByManager: {},
};

export default TransfersPage;
