import React, { useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import Select from 'react-select';
import bemHelper from '@kammy/bem';

import MultiToggle from '../../multi-toggle';
import Button from '../../button';
import Modal from '../../modal';
import Players from './components/Players';
// import GameWeekTransfers from './components/game-week-transfers';
import { changeTypes } from './lib/consts';
import createFilteredPlayers from './lib/create-filtered-players';

import './transferPage.scss';

const bem = bemHelper({ block: 'transfers-page' });

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

const TransfersPage = ({ teamsByManager, managers, isLoading }) => {
    const [initiateRequest, setInitiateRequest] = useState(false);
    const [manager, setManager] = useState(undefined);
    const [changeType, setChangeType] = useState(undefined);
    const [playerIn, setPlayerIn] = useState(undefined);
    const [playerOut, setPlayerOut] = useState(undefined);
    const [playerFilter, setPlayerFilter] = useState(undefined);
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
                    {!manager && (
                        <React.Fragment>
                            <h4>1. Who are you?</h4>
                            <MultiToggle
                                id={'manager'}
                                loadingMessage={'loading teams...'}
                                options={managers}
                                checked={manager}
                                onChange={setManager}
                            />
                        </React.Fragment>
                    )}
                    {manager && !changeType && (
                        <React.Fragment>
                            <h4>2. What type of request is it?</h4>
                            <MultiToggle
                                id={'change-type'}
                                options={Object.values(changeTypes)}
                                checked={changeType}
                                onChange={setChangeType}
                            />
                        </React.Fragment>
                    )}
                    {manager && changeType && !playerOut && (
                        <React.Fragment>
                            <h3>3. Who is Leaving the squad?</h3>
                            <div style={{ position: 'relative', zIndex: '2' }}>
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
                    {/* {manager && changeType && playerOut && !playerIn && ( */}
                    {/*    <React.Fragment> */}
                    {/*        <h3>4. Who is Joining the squad?</h3> */}
                    {/*        <div style={{ position: 'relative', zIndex: '2' }}> */}
                    {/*            <Select */}
                    {/*                placeholder="player filter..." */}
                    {/*                options={filterOptions} */}
                    {/*                isMulti */}
                    {/*                name={'playersFiltersIn'} */}
                    {/*                onChange={this.updatePlayerFilter} */}
                    {/*            /> */}
                    {/*        </div> */}
                    {/*        <div style={{ position: 'relative', zIndex: '1' }}> */}
                    {/*            {playersArray.length > 0 && ( */}
                    {/*                <Players */}
                    {/*                    onSelect={this.updatePlayerIn} */}
                    {/*                    playersArray={filteredPlayers.sortedPlayers} */}
                    {/*                /> */}
                    {/*            )} */}
                    {/*        </div> */}
                    {/*    </React.Fragment> */}
                    {/* )} */}
                    {/* {manager && changeType && playerOut && playerIn && ( */}
                    {/*    <React.Fragment> */}
                    {/*        <h3>Any Comments for the banter box?</h3> */}
                    {/*        <textarea className='transfers-page__comment' onChange={this.updateComment} /> */}
                    {/*        <h3>Confirm Request</h3> */}
                    {/*        <GameWeekTransfers */}
                    {/*            getGameWeekFromDate={gwFromDate} */}
                    {/*            transfers={[{ */}
                    {/*                manager, */}
                    {/*                timestamp: new Date(), */}
                    {/*                status: 'tbc', */}
                    {/*                type: changeType, */}
                    {/*                transferIn: playerIn ? playerIn.name : '', */}
                    {/*                transferOut: playerOut ? playerOut.name : '', */}
                    {/*                comment, */}
                    {/*            }]} */}
                    {/*            isLoading={false} */}
                    {/*            Action={( */}
                    {/*                <Button onClick={this.confirmTransfer} state={buttonState}> */}
                    {/*                    Confirm {changeType} */}
                    {/*                </Button> */}
                    {/*            )} */}
                    {/*        /> */}
                    {/*    </React.Fragment> */}
                    {/* )} */}
                </Modal>
            )}
        </div>
    );
};

TransfersPage.propTypes = {
    transfers: PropTypes.array,
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
