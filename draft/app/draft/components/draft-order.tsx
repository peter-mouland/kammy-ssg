// Updated Draft-order.jsx with completion detection
import * as React from 'react';
import { DraftConfetti } from './draft-confetti';
import { useToast } from '../../_shared/components/toast-manager';

import styles from './draft-order.module.css';

export function DraftOrder({ draftOrder, draftPicks, draftSequence, draftState }) {
    const { showToast } = useToast();
    const [showConfetti, setShowConfetti] = React.useState(false);
    const [celebrationShown, setCelebrationShown] = React.useState(false);

    const getNextPicker = () => {
        if (!draftState?.isActive || draftSequence.length === 0) return null;

        const actualPicksMade = draftPicks.length;
        const nextPickNumber = actualPicksMade + 1;

        const nextPickInSequence = draftSequence.find(pick => pick.pickNumber === nextPickNumber);
        return nextPickInSequence || null;
    };

    const isDraftComplete = () => {
        if (!draftState?.isActive || draftSequence.length === 0) return false;
        return draftPicks.length >= draftSequence.length;
    };

    const nextPicker = getNextPicker();
    const draftComplete = isDraftComplete();

    // Handle draft completion celebration
    React.useEffect(() => {
        if (draftComplete && !celebrationShown && draftPicks.length > 0) {
            // Show confetti
            setShowConfetti(true);
            setCelebrationShown(true);

            // Show toast notification
            showToast({
                message: "🎉 DRAFT COMPLETE! All picks are in! Good luck this season! 🏆",
                type: 'success',
                duration: 8000
            });

            // Optional: Play celebration sound
            try {
                const audio = new Audio('/celebration-sound.mp3'); // Add this file to your public folder
                audio.volume = 0.3;
                audio.play().catch(() => {
                    // Ignore audio errors (user might not have interacted with page yet)
                });
            } catch (error) {
                // Ignore audio errors
            }
        }
    }, [draftComplete, celebrationShown, draftPicks.length, showToast]);

    // Reset celebration when draft restarts
    React.useEffect(() => {
        if (!draftState?.isActive || draftPicks.length === 0) {
            setCelebrationShown(false);
            setShowConfetti(false);
        }
    }, [draftState?.isActive, draftPicks.length]);

    return (
        <div className="card">
            {/* Confetti Component */}
            <DraftConfetti
                show={showConfetti}
                onComplete={() => setShowConfetti(false)}
                duration={4000}
            />

            {/* Draft Order Header */}
            <div className="card-header">
                <h2 className="card-title">Draft Order</h2>
            </div>

            <div>

                {/* Next Picker or Completion Status */}
                {draftState?.isActive && (
                    <div className={styles.draftStatus}>
                        {draftComplete ? (
                            <div className={styles.draftCompleteStatus}>
                                <span className={styles.completeIcon}>🏁</span>
                                <span className={styles.completeText}>DRAFT COMPLETE!</span>
                                <div className={styles.completeSubtext}>
                                    {draftPicks.length} picks made • All teams are set!
                                </div>
                            </div>
                        ) : nextPicker ? (
                            null
                        ) : (
                            <div className={styles.draftLoading}>
                                <span>Calculating next pick...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rest of your existing draft order component */}
            <ul className={styles.draftOrderList}>
                {draftOrder.map((user, index) => (
                    <li
                        key={user.userId}
                        className={`${styles.draftOrderItem} ${
                            user.userId === draftState?.currentUserId ? styles.currentTurn : ''
                        } ${
                            user.userId === nextPicker?.userId ? styles.nextTurn : ''
                        }`}
                    >
                        <div className={styles.orderPosition}>#{index + 1}</div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user.userName}</div>
                            <div className={styles.teamName}>{user.teamName}</div>
                        </div>
                        {user.userId === draftState?.currentUserId && !draftComplete && (
                            <div className={styles.turnIndicator}>
                                <span className={styles.pickingNow}>⏰ on clock</span>
                            </div>
                        )}
                        {user.userId === nextPicker?.userId && !draftComplete && (
                            <div className={styles.nextIndicator}>
                                <span className={styles.onDeck}>Get Ready...</span>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {/* Draft Progress */}
            {draftState?.isActive && (
                <div className={styles.draftProgress}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${(draftPicks.length / draftSequence.length) * 100}%`,
                                backgroundColor: draftComplete ? '#10ac84' : '#45b7d1'
                            }}
                        />
                    </div>
                    <div className={styles.progressText}>
                        {draftPicks.length} of {draftSequence.length} picks complete
                        {draftComplete && <span className={styles.completeBadge}> ✓ DONE</span>}
                    </div>
                </div>
            )}
        </div>
    );
}
