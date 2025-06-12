/* Location: app/_shared/components/icon.tsx */

import styles from './icon.module.css';

interface IconProps {
    type: 'trophy' | 'chart' | 'team' | 'settings' | 'target' | 'stats' |
        'active' | 'inactive' | 'timer' | 'search' | 'draft' | 'refresh' |
        'delete' | 'generate' | 'start' | 'stop' | 'instructions' | 'check' |
        'error' | 'warning';
    fallback?: string;
    className?: string;
}

const iconMap = {
    trophy: { emoji: '🏆', text: 'Trophy' },
    chart: { emoji: '📊', text: 'Chart' },
    team: { emoji: '👥', text: 'Team' },
    settings: { emoji: '⚙️', text: 'Settings' },
    target: { emoji: '🎯', text: 'Target' },
    stats: { emoji: '📈', text: 'Stats' },
    active: { emoji: '🟢', text: 'Active' },
    inactive: { emoji: '🔴', text: 'Inactive' },
    timer: { emoji: '⏰', text: 'Timer' },
    search: { emoji: '🔍', text: 'Search' },
    draft: { emoji: '📋', text: 'Draft' },
    refresh: { emoji: '🔄', text: 'Refresh' },
    delete: { emoji: '🗑️', text: 'Delete' },
    generate: { emoji: '🎲', text: 'Generate' },
    start: { emoji: '🚀', text: 'Start' },
    stop: { emoji: '🛑', text: 'Stop' },
    instructions: { emoji: '📝', text: 'Instructions' },
    check: { emoji: '✅', text: 'Success' },
    error: { emoji: '❌', text: 'Error' },
    warning: { emoji: '⚠️', text: 'Warning' }
};

export function Icon({ type, fallback, className = '' }: IconProps) {
    const icon = iconMap[type];
    const displayText = fallback || icon.text;

    return (
        <span
            className={`${styles.emoji} ${className}`}
            role="img"
            aria-label={displayText}
            title={displayText}
        >
            {icon.emoji}
        </span>
    );
}

// Alternative text-based icons for critical UI elements
interface TextIconProps {
    type: 'active' | 'inactive' | 'check' | 'error' | 'warning' | 'up' | 'down' | 'left' | 'right';
    children?: React.ReactNode;
}

export function TextIcon({ type, children }: TextIconProps) {
    const iconText = {
        active: '[●]',
        inactive: '[○]',
        check: '[✓]',
        error: '[✗]',
        warning: '[!]',
        up: '[↑]',
        down: '[↓]',
        left: '[←]',
        right: '[→]'
    };

    return (
        <span className={`${styles.textIcon} ${styles[type]}`}>
            {iconText[type] || `[${type.toUpperCase()}]`}
            {children && ` ${children}`}
        </span>
    );
}
