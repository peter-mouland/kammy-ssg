import React, { useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import Select from 'react-select';
import bemHelper from '@kammy/bem';

import MultiToggle from '../../multi-toggle';
import Button from '../../button';
import Modal from '../../modal';
import Players from './components/Players';
import GameWeekTransfers from './components/game-week-transfers';
import { changeTypes } from './lib/consts';
import createFilteredPlayers from './lib/create-filtered-players';

import './transferPage.scss';

const bem = bemHelper({ block: 'transfers-page' });

const confirmTransfer = ({
    playerIn, playerOut, changeType, manager, playerDisplaced, playerGapFiller, comment, division, saveTransfers,
}) => {
    const baseDetails = {
        division, manager, status: 'TBC', transferType: changeType,
    };
    const transfers = [];
    if (playerDisplaced && playerGapFiller) {
        // rearrange transfer to ensure positions match for the spreadsheet
        transfers.push({
            ...baseDetails,
            transferIn: playerGapFiller.name,
            transferOut: playerOut.value,
            comment: `${comment} (note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
        });
        transfers.push({
            ...baseDetails,
            transferIn: playerIn.value,
            transferOut: playerDisplaced.name,
            comment: `(note: ${changeType} deal is ${playerIn.value} for ${playerOut.value}.)`,
        });
    } else {
        transfers.push({
            ...baseDetails, transferIn: playerIn.name, transferOut: playerOut.name, comment,
        });
    }
    console.log({
        playerIn, playerOut, changeType, manager, playerDisplaced, playerGapFiller, comment, division, saveTransfers,
    });
    saveTransfers(transfers);
    // initiateRequest(false);
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

const TransfersPage = ({
    divisionKey, teamsByManager, managers, isLoading,
}) => {
    const [initiateRequest, setInitiateRequest] = useState(false);
    const [comment, setComment] = useState(undefined);
    const [manager, setManager] = useState(undefined);
    const [changeType, setChangeType] = useState(undefined);
    const [playerIn, setPlayerIn] = useState(undefined);
    const [playerOut, setPlayerOut] = useState(undefined);
    const [playerFilter, setPlayerFilter] = useState(undefined);
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

    const defaultLeavingFilter = null; // filterOptions[1].options.filter((option) => option.value === manager);
    const filterOptions = createFilterOptions(managers, manager);

    const filteredPlayers = createFilteredPlayers({
        selectedOptions: playerFilter || [],
        // pendingTransfers: pendingTransfers[manager], // todo
        playersArray,
        team: teamsByManager[manager],
        teams: teamsByManager,
        playerIn,
        playerOut,
    });

    return (
        <div className={bem(null, null, 'page-content')} data-b-layout="container">
            <button onClick={() => setInitiateRequest(true)} disabled={isLoading}>Create Request</button>
            {initiateRequest && (
                <Modal
                    id={'new-transfer-request'}
                    title={'New Transfer Request'}
                    open={true}
                    onClose={() => setInitiateRequest(false)}
                >
                    <h4>1. Who are you?</h4>
                    <p>
                        <MultiToggle
                            id={'manager'}
                            loadingMessage={'loading teams...'}
                            options={managers}
                            checked={manager}
                            onChange={setManager}
                        />
                    </p>
                    <h4>2. What type of request is it?</h4>
                    <p>
                        <MultiToggle
                            id={'change-type'}
                            options={Object.values(changeTypes)}
                            checked={changeType}
                            onChange={setChangeType}
                        />
                    </p>
                    {manager && changeType && !playerOut && (
                        <React.Fragment>
                            <h3>3. Who is Leaving the squad?</h3>
                            <div style={{ position: 'relative', zIndex: '2' }}>
                                Manager:
                                <Select
                                    defaultValue={defaultLeavingFilter}
                                    placeholder="player filter..."
                                    options={filterOptions}
                                    isMulti
                                    name={'playersFiltersOut'}
                                    onChange={setPlayerFilter}
                                />
                            </div>
                            <div style={{ position: 'relative', zIndex: '1' }}>
                                {playersArray.length > 0 && (
                                    <Players
                                        onSelect={setPlayerOut}
                                        playersArray={filteredPlayers.sortedPlayers}
                                    />
                                )}
                            </div>
                        </React.Fragment>
                    )}
                    {manager && changeType && playerOut && !playerIn && (
                        <React.Fragment>
                            <h3>4. Who is Joining the squad?</h3>
                            <div style={{ position: 'relative', zIndex: '2' }}>
                                <Select
                                    placeholder="player filter..."
                                    options={filterOptions}
                                    isMulti
                                    name={'playersFiltersIn'}
                                    onChange={setPlayerFilter}
                                />
                            </div>
                            <div style={{ position: 'relative', zIndex: '1' }}>
                                {playersArray.length > 0 && (
                                    <Players
                                        onSelect={setPlayerIn}
                                        playersArray={filteredPlayers.sortedPlayers}
                                    />
                                )}
                            </div>
                        </React.Fragment>
                    )}
                    {manager && changeType && playerOut && playerIn && (
                        <React.Fragment>
                            <h3>Any Comments for the banter box?</h3>
                            <textarea className='transfers-page__comment' onChange={setComment} />
                            <h3>Confirm Request</h3>
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
                                        saveTransfers: () => {},
                                    })} state={'buttonState'}>
                                        Confirm {changeType}
                                    </Button>
                                )}
                            />
                        </React.Fragment>
                    )}
                </Modal>
            )}
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
    saveTransfers: PropTypes.func.isRequired,
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
