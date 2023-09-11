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
import useCup from '../../hooks/use-cup';
import TeamPicker from './team-picker';

const bem = bemHelper({ block: 'division-stats' });

const Cup = ({ Squads }) => {
    const managers = useManagers();
    const { saveTeam, isSaving: cupTeamIsSaving, isSaved } = useCup();
    const { getPendingTransfersByManager } = useAllTransfers();
    const [progress, setProgress] = useState(0);
    const [managerId, setManagerId] = useState('');
    const [picked, setPicked] = useState([]);

    const saveCupTeam = async () => {
        const [player1, player2, player3, player4] = picked;
        const cupTeamInput = {
            player1,
            player2,
            player3,
            player4,
            managerId,
            manager: managers.getManager(managerId).label,
        };
        await saveTeam(cupTeamInput);
        setProgress(3);
    };

    const closeModal = () => {
        setManagerId('');
        setPicked([]);
        setProgress(0);
    };

    const finishStep1 = (managerIdSelected) => {
        setManagerId(managerIdSelected);
        setPicked([]);
        setProgress(2);
    };

    const pickPlayer = (player, index) => {
        const newPicked = [...picked];
        newPicked[index] = player;
        setPicked(newPicked);
    };

    const startAgain = () => {
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
                    <MultiToggle id="managerId" options={managers.all} checked={managerId} onChange={finishStep1} />
                </Spacer>
            )}
            <Modal
                key="pickTeam"
                id="pickTeam"
                title={`${managerId}, Pick a Cup Team`}
                open={progress === 2 || cupTeamIsSaving}
                onClose={closeModal}
            >
                <TeamPicker
                    squad={Squads.byManagerId[managerId]}
                    pendingTransfers={getPendingTransfersByManager(managerId)}
                    managerId={managerId}
                    picked={picked}
                    handleChange={pickPlayer}
                    handleSubmit={saveCupTeam}
                    isSaving={cupTeamIsSaving}
                />
            </Modal>
            <Modal key="done" id="done" title="Team Saved" open={progress === 3 && isSaved} onClose={startAgain} center>
                <span style={{ fontSize: '3em' }}>🎖</span>
            </Modal>
        </section>
    );
};

Cup.propTypes = {
    Squads: PropTypes.object.isRequired,
};

export default Cup;
