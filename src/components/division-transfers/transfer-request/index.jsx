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

import './transferPage.scss';
import Spacer from '../../spacer';

const bem = bemHelper({ block: 'transfers-page' });

// todo: update table on mutation (via react-query)

const confirmTransfer = ({
    playerIn, playerOut, changeType, manager, playerDisplaced, playerGapFiller, comment, division, saveTransfer, reset,
}) => {
    const baseDetails = {
        Division: division, Manager: manager, Status: 'TBC', 'Transfer Type': changeType,
    };
    const transfers = [];
    if (playerDisplaced && playerGapFiller) {
        // rearrange transfer to ensure positions match for the spreadsheet
        transfers.push({
            ...baseDetails,
            'Transfer In': playerGapFiller.value,
            'Transfer Out': playerOut.value,
            Comment: `${comment} (note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
        });
        transfers.push({
            ...baseDetails,
            'Transfer In': playerIn.value,
            'Transfer Out': playerDisplaced.value,
            Comment: `(note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
        });
    } else {
        transfers.push({
            ...baseDetails, 'Transfer In': playerIn.value, 'Transfer Out': playerOut.value, Comment: comment,
        });
    }

    saveTransfer({ division, data: transfers });
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
                ...managers
                    .map((mngr) => ({ value: mngr, label: `${mngr}${mngr === manager ? '*' : ''}`, group: 'manager' })),
            ],
        },
        {
            label: 'Positions',
            options: positions,
        },
    ];
};

const Search = ({
    filterOptions, onSelect, onFilter, playersArray, playerFilter, filteredPlayers,
}) => (
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
                    name={'playersFiltersOut'}
                    onChange={onFilter}
                />
            </div>
        </Spacer>
        <div style={{ position: 'relative', zIndex: '1' }}>
            {playersArray.length > 0 && (
                <Players
                    onSelect={onSelect}
                    playersArray={filteredPlayers.sortedPlayers}
                />
            )}
        </div>
    </Spacer>
);

const TransfersPage = ({
    divisionKey, teamsByManager, managers, isLoading,
}) => {
    const [DrawerContent, setDrawerContent] = useState(undefined);
    const [initiateRequest, setInitiateRequest] = useState(false);
    const [comment, setComment] = useState('');
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
        setPlayerIn(false);
        setPlayerOut(false);
        setPlayerFilter(false);
        setInitiateRequest(false);
    };
    // const gwFromDate = gameWeekSelectors.getGameWeekFromDate(state);
    const { allPlayers: { nodes: playersArray } } = useStaticQuery(graphql`
        query TransferPlayers {
            allPlayers(filter: {isHidden: {eq: false}}) {
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
        <div className={bem(null, null, 'page-content')} >
            <Drawer
                isCloseable
                hasBackdrop
                onClose={() => setDrawerContent(undefined)}
                isOpen={!!DrawerContent}
                placement={Drawer.placements.RIGHT}
                theme={Drawer.themes.LIGHT}
            >
                {DrawerContent === 'playerIn' ? <RequestPlayerIn /> : <RequestPlayerOut /> }
            </Drawer>
            <Accordion
                title={'Create Request'}
                description={'Initiate a Transfer, Loan, Swap or Trade'}
                type={Accordion.types.SECONDARY}
            >
                <Accordion.Content>
                    <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                        <h4>1. Who are you?</h4>
                    </Spacer>
                    <MultiToggle
                        id={'manager'}
                        loadingMessage={'loading teams...'}
                        options={managers}
                        checked={manager}
                        onChange={setManager}
                    />
                </Accordion.Content>
                <Accordion.Content>
                    <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                        <h4>2. What type of request is it?</h4>
                    </Spacer>
                    <MultiToggle
                        id={'change-type'}
                        options={Object.values(changeTypes)}
                        checked={changeType}
                        onChange={setChangeType}
                    />
                </Accordion.Content>

                {manager && changeType && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            <h3>3. Who is Leaving the squad?</h3>
                        </Spacer>
                        <div>
                            {playerOut && playerOut.label}
                        </div>
                        <Button onClick={() => setDrawerContent('playerOut')
                        }>Pick</Button>
                    </Accordion.Content>
                )}

                {manager && changeType && playerOut && (
                    <Accordion.Content>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            <h3>4. Who is Joining the squad?</h3>
                        </Spacer>
                        <div>
                            {playerIn && playerIn.label}
                        </div>
                        <Button onClick={() => setDrawerContent('playerIn')
                        }>Pick</Button>
                    </Accordion.Content>
                )}

                {manager && changeType && playerOut && playerIn && (
                    <React.Fragment>
                        <Accordion.Content>
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                                <h3>Any Comments for the banter box?</h3>
                            </Spacer>
                            <textarea className='transfers-page__comment' onChange={setComment} />
                        </Accordion.Content>
                        <Accordion.Content>
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                                <h3>Confirm Request</h3>
                            </Spacer>
                            <GameWeekTransfers
                            // getGameWeekFromDate={gwFromDate}
                                transfers={[{
                                    manager,
                                    timestamp: new Date(),
                                    status: 'tbc',
                                    type: changeType,
                                    transferIn: playerIn ? playerIn.value : '',
                                    transferOut: playerOut ? playerOut.value : '',
                                    comment,
                                }]}
                                isLoading={false}
                                Action={(
                                    <Button onClick={() => confirmTransfer({
                                        playerIn,
                                        playerOut,
                                        changeType,
                                        manager,
                                        comment,
                                        division: divisionKey,
                                        saveTransfer,
                                        reset,
                                    })} state={'buttonState'}>
                                        Confirm {changeType}
                                    </Button>
                                )}
                            />
                        </Accordion.Content>
                    </React.Fragment>
                )}
            </Accordion>
        </div>
    );
};

TransfersPage.propTypes = {
    transfers: PropTypes.array,
    divisionKey: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    division: PropTypes.string.isRequired,
    gameWeeks: PropTypes.array,
    managers: PropTypes.array,
    players: PropTypes.object,
    playersArray: PropTypes.array,
    teamsByManager: PropTypes.object,
    pendingTransfers: PropTypes.object,
    dateIsInCurrentGameWeek: PropTypes.func.isRequired,
    fetchTransfers: PropTypes.func.isRequired,
    gwFromDate: PropTypes.func.isRequired,
    transfersSaving: PropTypes.bool,
    isLoading: PropTypes.bool,
    playersLoaded: PropTypes.bool,
    transfersLoading: PropTypes.bool,
    gameWeeksLoading: PropTypes.bool,
};

TransfersPage.defaultProps = {
    playersLoaded: false,
    transfersSaving: false,
    transfersLoading: false,
    gameWeeksLoading: false,
    transfers: [],
    gameWeeks: [],
    pendingTransfers: {},
    players: null,
    playersArray: null,
    teams: {},
};

export default TransfersPage;
