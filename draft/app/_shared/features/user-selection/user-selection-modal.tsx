/* Location: app/_shared/components/user-selection-modal.tsx */

import { useCallback, useEffect, useState } from 'react';
import type { UserTeamsSheetData } from '../../../teams/types/team-types';
import { setUserSelection } from './user-selection.utils';
import styles from './user-selection-modal.module.css';

interface UserSelectionModalProps {
    users: UserTeamsSheetData[];
    isOpen: boolean;
    onUserSelect: (userId: string) => void;
    onClose?: () => void;
    allowClose?: boolean;
}

export function UserSelectionModal({
    users,
    isOpen,
    onUserSelect,
    onClose,
    allowClose = false,
}: UserSelectionModalProps) {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle user selection
    const handleUserSelect = useCallback(
        (userId: string) => {
            setSelectedUserId(userId);
            setIsAnimating(true);

            // Set cookie and update URL
            setUserSelection(userId, true);

            // Small delay for visual feedback before calling onUserSelect
            setTimeout(() => {
                onUserSelect(userId);
                setIsAnimating(false);
            }, 300);
        },
        [onUserSelect],
    );

    // Handle ESC key to close (only if allowed)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && allowClose && onClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, allowClose, onClose]);

    // Group users by division for better organization
    const usersByDivision = users.reduce(
        (acc, user) => {
            if (!acc[user.divisionId]) {
                acc[user.divisionId] = [];
            }
            acc[user.divisionId].push(user);
            return acc;
        },
        {} as Record<string, UserTeamsSheetData[]>,
    );

    const divisionNames = {
        premierLeague: 'Premier League',
        championship: 'Championship',
        leagueOne: 'League One',
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${isAnimating ? styles.selecting : ''}`}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerIcon}>👤</div>
                    <h2 className={styles.modalTitle}>Who are you?</h2>
                    <p className={styles.modalSubtitle}>
                        Select your name to access your team and personalize your experience
                    </p>

                    {allowClose && onClose && (
                        <button type={'button'} onClick={onClose} className={styles.closeButton} aria-label="Close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* User Selection */}
                <div className={styles.modalBody}>
                    {Object.entries(usersByDivision).map(([divisionId, divisionUsers]) => (
                        <div key={divisionId} className={styles.divisionGroup}>
                            <h3 className={styles.divisionTitle}>
                                {divisionNames[divisionId as keyof typeof divisionNames] || divisionId}
                            </h3>

                            <div className={styles.usersGrid}>
                                {divisionUsers.map((user) => (
                                    <button
                                        type={'button'}
                                        key={user.userId}
                                        onClick={() => handleUserSelect(user.userId)}
                                        className={`${styles.userButton} ${
                                            selectedUserId === user.userId ? styles.selected : ''
                                        }`}
                                        disabled={isAnimating}
                                    >
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>{user.userName}</div>
                                        </div>
                                        <div className={styles.userIcon}>
                                            {selectedUserId === user.userId ? (
                                                <div className={styles.checkmark}>✓</div>
                                            ) : (
                                                <div className={styles.arrow}>→</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <p className={styles.footerText}>Your selection will be remembered for future visits</p>
                </div>

                {/* Loading overlay when selecting */}
                {isAnimating && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner} />
                        <div className={styles.loadingText}>Setting up your profile...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
