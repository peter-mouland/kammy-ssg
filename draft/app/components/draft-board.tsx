import { getPositionDisplayName } from '../lib/points';
import styles from './draft-board.module.css';

interface DraftPickData {
    pickNumber: number;
    userId: string;
    playerName: string;
    position: string;
    teamName: string;
    price: number;
}

interface DraftBoardProps {
    draftPicks: DraftPickData[];
}

export function DraftBoard({ draftPicks }: DraftBoardProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Draft Board</h2>
                <p style={{ color: '#6b7280' }}>
                    {draftPicks.length} picks made
                </p>
            </div>

            <div className={styles.draftBoard}>
                {draftPicks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <p className={styles.emptyMessage}>
                            No picks made yet. Draft will begin soon!
                        </p>
                    </div>
                ) : (
                    <div className={styles.picksList}>
                        {draftPicks
                            .sort((a, b) => b.pickNumber - a.pickNumber)
                            .slice(0, 20)
                            .map((pick) => (
                                <div key={pick.pickNumber} className={styles.pickItem}>
                                    <div className={styles.pickHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={styles.pickNumber}>
                                                #{pick.pickNumber}
                                            </span>
                                            <span className={styles.playerName}>
                                                {pick.playerName}
                                            </span>
                                        </div>
                                        <span className={styles.managerName}>
                                            {pick.userId}
                                        </span>
                                    </div>

                                    <div className={styles.pickDetails}>
                                        <span>{getPositionDisplayName(pick.position)}</span>
                                        <span>•</span>
                                        <span>{pick.teamName}</span>
                                        <span>•</span>
                                        <span>£{pick.price}m</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
