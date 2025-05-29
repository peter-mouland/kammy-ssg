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
            className={`emoji ${className}`}
            role="img"
            aria-label={displayText}
            title={displayText}
        >
      {icon.emoji}
    </span>
    );
}

// Alternative text-based icons for critical UI elements
export function TextIcon({ type, children }: { type: string; children?: React.ReactNode }) {
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
        <span
            style={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: type === 'active' ? '#10b981' :
                    type === 'error' ? '#ef4444' :
                        type === 'warning' ? '#f59e0b' : 'inherit'
            }}
        >
      {iconText[type as keyof typeof iconText] || `[${type.toUpperCase()}]`}
            {children && ` ${children}`}
    </span>
    );
}
