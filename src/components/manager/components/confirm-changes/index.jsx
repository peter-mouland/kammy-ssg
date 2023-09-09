/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import useSquadChanges from '../../../../hooks/use-squad-changes';
import usePlayers from '../../../../hooks/use-players';
import Spacer from '../../../spacer';
import Button from '../../../button';
import * as styles from './confirm-changes.module.css';
import Player from '../../../player';
import Accordion from '../accordion';

const confirmChange = async ({ comment, newChanges, divisionId, saveSquadChange, reset }) => {
    const timestamp = new Date();
    const data = newChanges.map(({ type, playerIn, playerOut, managerId, ...transfer }) => ({
        ...transfer,
        timestamp,
        type,
        managerId,
        Division: divisionId,
        Manager: managerId,
        Status: transfer.status,
        isPending: false,
        'Transfer Type': type,
        'Transfer In': playerIn.name,
        'Transfer Out': playerOut.name,
        Comment: comment,
    }));

    await saveSquadChange({ division: divisionId, data });
    reset();
};

const Manager = ({ managerName, teamsByManager, gameWeek, divisionId, newChanges }) => {
    const [comment, setComment] = useState('');
    const { playersByName } = usePlayers();
    const { isLoading, isSaving, saveSquadChange, pendingChanges, hasPendingChanges } = useSquadChanges({
        selectedGameWeek: gameWeek,
        divisionId,
        teamsByManager,
    });
    const managerChanges = pendingChanges.filter(({ manager }) => manager === managerName);

    // can't auto-confirm changes if any one in the lague has pending changes
    // even subs due to potential loan and trades
    const note = hasPendingChanges ? (
        <span>🤔 due to other unconfirmed changes, you will have to wait to see this applied</span>
    ) : (
        <span>🎉 this change will be confirm immediately</span>
    );
    const highlights = newChanges.length ? [note] : [];

    return (
        <Accordion title="Confirm Changes" count={newChanges.length} highlights={highlights} rules={{}}>
            <Spacer all={{ stack: Spacer.spacings.MEDIUM }} className={styles.preview}>
                <div className={styles.out}>
                    <h3>Players Leaving</h3>

                    {newChanges.map(({ transferOut }) =>
                        transferOut ? <Player key={transferOut} player={playersByName[transferOut]} small /> : null,
                    )}
                </div>
                <div className={styles.icon} />
                <div className={styles._in}>
                    <h3>Players Arriving</h3>
                    {newChanges.map(({ transferIn }) =>
                        transferIn ? <Player key={transferIn} player={playersByName[transferIn]} small /> : null,
                    )}
                </div>
                <div className={styles.comments}>
                    <Spacer all={{ stack: Spacer.spacings.TINY }}>
                        <h3>Comments</h3>
                        <textarea
                            className="transfers-page__comment"
                            onChange={(e) => setComment(e.currentTarget.value)}
                        />
                    </Spacer>
                </div>
                <div className={styles.cta}>
                    <Button
                        isDisabled={newChanges.length === 0}
                        onClick={() =>
                            confirmChange({
                                comment,
                                newChanges,
                                divisionId,
                                saveSquadChange,
                                reset: () => {},
                            })
                        }
                        state="buttonState"
                        isLoading={isLoading || isSaving}
                    >
                        Save {newChanges.length} Change(s)
                    </Button>
                </div>
            </Spacer>
        </Accordion>
    );
};

export default Manager;
