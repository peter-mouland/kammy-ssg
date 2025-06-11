import styles from './scoring-info.module.css';

export const ScoringInfo = () => (
    <div className={styles.scoringInfo}>
        <h3 className={styles.scoringTitle}>Custom Scoring System:</h3>
        <div className={styles.scoringGrid}>
            <div className={styles.scoringItem}>
                <strong>Minutes Played:</strong>
                <div>+3 pts (45+ min), +1 pt (&lt;45 min)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Goals:</strong>
                <div>GK: +10, CB/FB: +8, MID: +5, WA/CA: +4</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Assists:</strong> <div>+3 pts (all positions)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Clean Sheets:</strong>
                <div>+5 pts (GK, CB, FB), +3 pts (MID)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Goals Conceded:</strong>
                <div>-1 pt per goal after 1st (GK, CB, FB only)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Yellow Cards:</strong>
                <div>-1 pt (all positions)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Red Cards:</strong>
                <div>-3 pts (GK, CB, FB), -5 pts (MID, WA, CA)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Saves:</strong>
                <div>+1 pt per 3 saves (GK only)</div>
            </div>
            <div className={styles.scoringItem}>
                <strong>Bonus Points:</strong>
                <div>Full value (CB, MID only)</div>
            </div>
        </div>
    </div>
)
