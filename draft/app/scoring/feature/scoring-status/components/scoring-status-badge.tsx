// Scoring Status Badge Component

import type { ScoringStatus } from '../types';
import styles from './scoring-status-badge.module.css';

interface ScoringStatusBadgeProps {
    status: ScoringStatus;
    variant?: 'dot' | 'label';
    children?: React.ReactNode;
    onClick?: () => void;
}

/**
 * Visual indicator for scoring status
 *
 * Variants:
 * - 'dot': Small circular indicator with pulse animation (for headers/nav)
 * - 'label': Full badge with background and text (for footers/standalone)
 */
export function ScoringStatusBadge({ status, variant = 'dot', children, onClick }: ScoringStatusBadgeProps) {
    const getTitle = () => {
        switch (status) {
            case 'up-to-date':
                return 'Scores up to date';
            case 'pending':
                return onClick ? 'Click to view pending games' : 'Awaiting gameweek completion';
            case 'stale':
                return 'New games played - scores need updating';
            default:
                return '';
        }
    };

    const getStatusClassName = () => {
        if (variant === 'dot') {
            switch (status) {
                case 'up-to-date':
                    return styles.statusDotGreen;
                case 'pending':
                    return styles.statusDotOrange;
                case 'stale':
                    return styles.statusDotRed;
                default:
                    return styles.statusDotGreen;
            }
        } else {
            switch (status) {
                case 'up-to-date':
                    return styles.statusLabelGreen;
                case 'pending':
                    return styles.statusLabelOrange;
                case 'stale':
                    return styles.statusLabelRed;
                default:
                    return styles.statusLabelGreen;
            }
        }
    };

    const baseClassName = variant === 'dot' ? styles.statusDot : styles.statusLabel;
    const className = `${baseClassName} ${getStatusClassName()}`;
    const isClickable = onClick && status === 'pending';

    const style = isClickable ? { cursor: 'pointer' } : undefined;

    if (variant === 'label' && children) {
        return (
            <span className={className} title={getTitle()} onClick={isClickable ? onClick : undefined} style={style}>
                {children}
            </span>
        );
    }

    return (
        <span
            className={className}
            title={getTitle()}
            aria-label={getTitle()}
            onClick={isClickable ? onClick : undefined}
            style={style}
        />
    );
}
