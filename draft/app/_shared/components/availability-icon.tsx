/* Location: app/_shared/components/availability-icon.tsx */

import styles from './availability-icon.module.css';

/** FPL's status letter for a player who is not simply available. */
export type PlayerAvailabilityStatus = 'd' | 'i' | 's' | 'u' | 'n';

/** Whether FPL expects a player to play, for anyone who is in some doubt. */
export interface PlayerAvailability {
    status: PlayerAvailabilityStatus;
    /** FPL's 0-100 chance of playing next gameweek, when it gives one. */
    chanceNextRound?: number;
}

/** What the icon says out loud and on hover: "Doubtful: 75% chance of playing next gameweek". */
export function describeAvailability({ status, chanceNextRound }: PlayerAvailability): string {
    switch (status) {
        case 'd':
            return chanceNextRound === undefined
                ? 'Doubtful'
                : `Doubtful: ${chanceNextRound}% chance of playing next gameweek`;
        case 'i':
            return 'Injured';
        case 's':
            return 'Suspended';
        default:
            return 'Unavailable';
    }
}

/**
 * One small icon for FPL's view of whether a player will play. Simple shapes drawn here, so
 * they look the same on every device and take their colour from tokens: a circle holding the
 * percentage for a doubt, a cross for an injury, a card for a suspension, a dash for anyone
 * unavailable (left the club, on loan). All four live in this one component, so a different
 * icon set can replace them without touching anything else.
 */
export function AvailabilityIcon({ availability }: { availability: PlayerAvailability }) {
    const label = describeAvailability(availability);
    return (
        <span className={styles.availabilityIcon} role="img" aria-label={label} title={label}>
            <AvailabilityShape availability={availability} />
        </span>
    );
}

function AvailabilityShape({ availability: { status, chanceNextRound } }: { availability: PlayerAvailability }) {
    if (status === 'd') {
        return (
            <svg className={`${styles.shape} ${styles.doubtful}`} viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="8" className={styles.fill} />
                <text x="8" y="8" fontSize="8" className={styles.chance} textAnchor="middle" dominantBaseline="central">
                    {chanceNextRound ?? '?'}
                </text>
            </svg>
        );
    }
    if (status === 'i') {
        return (
            <svg className={`${styles.shape} ${styles.injured}`} viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="8" className={styles.fill} />
                <path d="M6.5 3.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" className={styles.mark} />
            </svg>
        );
    }
    if (status === 's') {
        return (
            <svg className={`${styles.shape} ${styles.suspended}`} viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3.5" y="1" width="9" height="14" rx="1.5" className={styles.fill} />
            </svg>
        );
    }
    return (
        <svg className={`${styles.shape} ${styles.unavailable}`} viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="8" className={styles.fill} />
            <rect x="4" y="7" width="8" height="2" rx="1" className={styles.mark} />
        </svg>
    );
}
