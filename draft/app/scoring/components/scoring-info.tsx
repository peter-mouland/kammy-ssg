/* Location: app/scoring/components/scoring-info.tsx */

import { useState } from 'react';
import styles from './scoring-info.module.css';

export const ScoringInfo = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={styles.scoringInfo}>
            <button
                type={'button'}
                className={styles.scoringHeader}
                onClick={handleToggle}
                aria-expanded={isExpanded}
                aria-controls="scoring-content"
            >
                <h3 className={styles.scoringTitle}>Scoring System:</h3>
                <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>▼</span>
            </button>

            <div id="scoring-content" className={`${styles.scoringContent} ${isExpanded ? '' : styles.collapsed}`}>
                <div className={styles.scoringGrid}>
                    <div className={styles.scoringItem}>
                        <strong>Minutes Played:</strong>
                        <div>+1 pt (&lt;45 min)</div>
                        <div>+3 pts (45+ min)</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Goals:</strong>
                        <div>GK: +10, CB/FB: +8</div>
                        <div>MID/WA/CA: +4</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Assists:</strong> <div>+3 pts</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Clean Sheets:</strong>
                        <div>GK/CB/FB: +5 pts</div>
                        <div>MID: +2 pts</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Goals Conceded:</strong>
                        <div>GK/CB/FB: -1 pt</div>
                        <div>(per goal after 1st)</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Yellow Cards:</strong>
                        <div>-1 pt</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Red Cards:</strong>
                        <div>GK/CB/FB: -3 pts</div>
                        <div>MID/WA/CA: -5 pts</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Saves:</strong>
                        <div>GK: +1 pt per 3 saves</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Bonus Points:</strong>
                        <div>CB/MID: Full value</div>
                    </div>
                    <div className={styles.scoringItem}>
                        <strong>Defensive Contribution:</strong>
                        <div>CB/FB: +1 pts</div>
                        <div>MID: +2 pts</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
