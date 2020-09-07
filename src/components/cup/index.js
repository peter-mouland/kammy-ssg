import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '@kammy/bootstrap';
import bemHelper from '@kammy/bem';

import Spacer from '../spacer';
import Button from '../button';
import Modal from '../modal';
import MultiToggle from '../multi-toggle';
import useAllTransfers from '../../hooks/use-all-transfers';
import useManagers from '../../hooks/use-managers';
import PlayerPicker from './player-picker';

const bem = bemHelper({ block: 'division-stats' });

const PickCupTeam = ({ team, pendingTransfers, manager, handleChange, handleSubmit, picked, isSaving }) => (
    <section>
        {[1, 2, 3, 4].map((index) => {
            const id = `manager-${manager}-player-${index}`;
            return (
                <div key={id}>
                    <label htmlFor={id}>
                        <span>Player {index}: </span>
                        <PlayerPicker
                            playerNumber={index - 1}
                            pendingTransfers={pendingTransfers}
                            picked={picked}
                            id={id}
                            team={team}
                            handleChange={handleChange}
                        />
                    </label>
                </div>
            );
        })}
        <div>
            <p>
                <strong>Important</strong>: The order in which you pick your players matters!
            </p>
            <p>
                In the event of tied scores, Player 1&apos;s score will be used as a tie break. If that fails to
                separate teams, Player 2&apos;s score will be used... and so on until there is a clear winner.
            </p>
            <Button onClick={handleSubmit} isLoading={isSaving} isDisabled={isSaving}>
                Save Cup Team
            </Button>
        </div>
    </section>
);

PickCupTeam.propTypes = {
    manager: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    team: PropTypes.arrayOf(
        PropTypes.shape({
            playerName: PropTypes.string.isRequired,
        }),
    ).isRequired,
    isSaving: PropTypes.bool,
    picked: PropTypes.array,
    pendingTransfers: PropTypes.array,
};
PickCupTeam.defaultProps = {
    isSaving: false,
    picked: [],
    pendingTransfers: [],
};

PickCupTeam.defaulProps = {
    picked: [],
    saving: false,
};

const Cup = ({ currentTeams }) => {
    const saving = false;
    const saved = false;
    const { managerNames: managers } = useManagers();
    const { isLoading: isTransfersLoading, getPendingTransfersByManager } = useAllTransfers();
    const [progress, setProgress] = useState(0);
    const [manager, setManager] = useState('');
    const [round] = useState(0);
    const [picked, setPicked] = useState([]);

    const saveCupTeam = () => {
        // const [player1, player2, player3, player4] = picked;
        // const team = cupTeams.find(({ manager: cupManager }) => manager === cupManager) || {};
        // const cupTeamInput = {
        //     player1,
        //     player2,
        //     player3,
        //     player4,
        //     manager,
        //     round,
        //     group: team.group,
        // };
        // dispatch(cupActions.saveCupTeam(cupTeamInput));
        // setProgress(3);
    };
    // const hasFetchCup = cupLoaded || cupLoading;
    // const hasFetchPremierLeague = premierLeagueLoaded || premierLeagueLoading;
    // const hasFetchChampionship = championshipLoaded || championshipLoading;
    // const hasFetchLeagueOne = leagueOneLoaded || leagueOneLoading;
    //
    const closeModal = () => {
        setManager('');
        setPicked([]);
        // setRound('');
        setProgress(0);
    };

    const finishStep1 = (selection) => {
        setManager(selection);
        setPicked([]);
        // setRound('');
        setProgress(2);
    };

    const pickPlayer = (player, index) => {
        const newPicked = [...picked];
        newPicked[index] = player;
        setPicked(newPicked);
    };

    // cupActions.fetchCup();

    const startAgain = () => {
        // cupActions.resetCupSave();
        closeModal();
    };

    return (
        <section id="cup-page" className={bem()}>
            {progress === 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <Button onClick={() => setProgress(1)}>Pick a Cup Team</Button>
                </Spacer>
            )}
            {progress === 1 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <h2>Who are you?</h2>
                    <MultiToggle id="manager" options={managers} checked={manager} onChange={finishStep1} />
                </Spacer>
            )}
            <Modal
                key="pickTeam"
                id="pickTeam"
                title="Who do you want to pick?"
                open={progress === 2 || saving}
                onClose={closeModal}
            >
                <PickCupTeam
                    team={currentTeams[manager]}
                    pendingTransfers={getPendingTransfersByManager(manager)}
                    manager={manager}
                    picked={picked}
                    handleChange={pickPlayer}
                    handleSubmit={() => {}}
                    saving={saving}
                />
            </Modal>
            <Modal key="done" id="done" title="Team Saved" open={progress === 3 && saved} onClose={startAgain} center>
                <span style={{ 'font-size': '3em' }}>🎖</span>
            </Modal>
        </section>
    );
};

Cup.contextTypes = {
    appConfig: PropTypes.object,
};

export default Cup;
