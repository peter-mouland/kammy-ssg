// Updated Draft-order.jsx with completion detection
import * as React from 'react';
import { DraftConfetti } from './draft-confetti';
import { useToast } from './toast-manager';

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
        <div className="draft-order">
            {/* Confetti Component */}
            <DraftConfetti
                show={showConfetti}
                onComplete={() => setShowConfetti(false)}
                duration={4000}
            />

            {/* Draft Order Header */}
            <div className="draft-order-header">
                <h3>Draft Order</h3>

                {/* Next Picker or Completion Status */}
                {draftState?.isActive && (
                    <div className="draft-status">
                        {draftComplete ? (
                            <div className="draft-complete-status">
                                <span className="complete-icon">🏁</span>
                                <span className="complete-text">DRAFT COMPLETE!</span>
                                <div className="complete-subtext">
                                    {draftPicks.length} picks made • All teams are set!
                                </div>
                            </div>
                        ) : nextPicker ? (
                            <div className="next-picker">
                                <span className="up-next-label">Up Next:</span>
                                <span className="next-picker-name">{nextPicker.userName}</span>
                                <span className="pick-number">Pick #{nextPicker.pickNumber}</span>
                            </div>
                        ) : (
                            <div className="draft-loading">
                                <span>Calculating next pick...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rest of your existing draft order component */}
            <div className="draft-order-list">
                {draftOrder.map((user, index) => (
                    <div
                        key={user.userId}
                        className={`draft-order-item ${
                            user.userId === draftState?.currentUserId ? 'current-turn' : ''
                        } ${
                            user.userId === nextPicker?.userId ? 'next-turn' : ''
                        }`}
                    >
                        <div className="order-position">#{index + 1}</div>
                        <div className="user-info">
                            <div className="user-name">{user.userName}</div>
                            <div className="team-name">{user.teamName}</div>
                        </div>
                        {user.userId === draftState?.currentUserId && !draftComplete && (
                            <div className="turn-indicator">
                                <span className="picking-now">Picking Now</span>
                            </div>
                        )}
                        {user.userId === nextPicker?.userId && !draftComplete && (
                            <div className="next-indicator">
                                <span className="on-deck">On Deck</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Draft Progress */}
            {draftState?.isActive && (
                <div className="draft-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${(draftPicks.length / draftSequence.length) * 100}%`,
                                backgroundColor: draftComplete ? '#10ac84' : '#45b7d1'
                            }}
                        />
                    </div>
                    <div className="progress-text">
                        {draftPicks.length} of {draftSequence.length} picks complete
                        {draftComplete && <span className="complete-badge"> ✓ DONE</span>}
                    </div>
                </div>
            )}

            <style jsx>{`
                .draft-complete-status {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem;
                    background: linear-gradient(135deg, #10ac84, #00d2d3);
                    border-radius: 0.5rem;
                    color: white;
                    text-align: center;
                    animation: celebrationPulse 2s ease-in-out infinite;
                }

                .complete-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .complete-text {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }

                .complete-subtext {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .progress-fill {
                    transition: all 0.3s ease;
                }

                .complete-badge {
                    color: #10ac84;
                    font-weight: bold;
                }

                @keyframes celebrationPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .next-picker {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.75rem;
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 0.5rem;
                    color: #92400e;
                }

                .up-next-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }

                .next-picker-name {
                    font-weight: bold;
                    font-size: 1rem;
                }

                .pick-number {
                    font-size: 0.875rem;
                    opacity: 0.8;
                }
            `}</style>
        </div>
    );
}
