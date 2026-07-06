// app/transfers/lib/format-eligibility-status.ts

import type { ManagerId, UserTeamsSheetData } from '../../teams/types/team-types';

export type EligibilitySeverity = 'blocking' | 'warning' | 'success' | 'info';

export interface FormattedEligibilityStatus {
    text: string;
    icon: string;
    severity: EligibilitySeverity;
    fullMessage: string;
}

const GAMEWEEK_RULE_ID = 'transfer-limit-per-gameweek';

export function getManagerDisplayName(managers: UserTeamsSheetData[], managerId: ManagerId): string {
    return managers.find((manager) => manager.userId === managerId)?.userName ?? managerId;
}

export function isGameweekLimitMessage(ruleId?: string, message?: string): boolean {
    return (
        ruleId === GAMEWEEK_RULE_ID || (message?.includes('Would exceed') && message.includes('this gameweek')) === true
    );
}

export function formatEligibilityStatus({
    message,
    ruleId,
    severity = 'blocking',
    managerId,
    managers,
}: {
    message: string;
    ruleId?: string;
    severity?: 'blocking' | 'warning';
    managerId: ManagerId;
    managers: UserTeamsSheetData[];
}): FormattedEligibilityStatus {
    const normalizedMessage = message.replace(/^⚠️\s*/, '');
    const currentManagerName = getManagerDisplayName(managers, managerId);

    if (normalizedMessage === 'Already in your team') {
        return {
            text: currentManagerName,
            icon: '👤',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (normalizedMessage === 'Already own 2 players from this team') {
        return {
            text: 'Max 2 per club',
            icon: '⚠️',
            severity: 'warning',
            fullMessage: normalizedMessage,
        };
    }

    const ownedByMatch = normalizedMessage.match(/^Owned by (.+)$/);
    if (ownedByMatch) {
        return {
            text: getManagerDisplayName(managers, ownedByMatch[1]),
            icon: '👤',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (normalizedMessage.includes('Position mismatch')) {
        return {
            text: 'Wrong position',
            icon: '🚫',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (normalizedMessage.includes('Transfer would exceed position limits')) {
        return {
            text: 'Position limit',
            icon: '📊',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (isGameweekLimitMessage(ruleId, normalizedMessage)) {
        return {
            text: formatGameweekLimitDisplay(normalizedMessage),
            icon: '⏱️',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (normalizedMessage === 'Error checking eligibility') {
        return {
            text: 'Error',
            icon: '❌',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (normalizedMessage === 'unknown state') {
        return {
            text: 'Unavailable',
            icon: '❌',
            severity: 'blocking',
            fullMessage: normalizedMessage,
        };
    }

    if (
        normalizedMessage === 'Ownership check passed' ||
        normalizedMessage === 'Player is available for transfer' ||
        normalizedMessage === 'teamCountLimit check passed' ||
        normalizedMessage.includes('Transfer within limits for gameweek')
    ) {
        return {
            text: 'Free Agent',
            icon: '✅',
            severity: 'success',
            fullMessage: normalizedMessage,
        };
    }

    const displaySeverity: EligibilitySeverity = severity === 'warning' ? 'warning' : 'blocking';

    return {
        text: normalizedMessage.length > 28 ? `${normalizedMessage.slice(0, 28)}…` : normalizedMessage,
        icon: displaySeverity === 'warning' ? '⚠️' : '❌',
        severity: displaySeverity,
        fullMessage: normalizedMessage,
    };
}

export function formatGameweekLimitDisplay(message: string): string {
    const transferMatch = message.match(/(\d+)\/(\d+) transfers this gameweek/);
    if (transferMatch) {
        return `${transferMatch[1]}/${transferMatch[2]} transfers`;
    }

    const swapMatch = message.match(/(\d+)\/(\d+) swaps this gameweek/);
    if (swapMatch) {
        return `${swapMatch[1]}/${swapMatch[2]} swaps`;
    }

    const newPlayerMatch = message.match(/(\d+)\/(\d+) new players this gameweek/);
    if (newPlayerMatch) {
        return `${newPlayerMatch[1]}/${newPlayerMatch[2]} new players`;
    }

    const tradeMatch = message.match(/(\d+)\/(\d+) trades this gameweek/);
    if (tradeMatch) {
        return `${tradeMatch[1]}/${tradeMatch[2]} trades`;
    }

    return 'Transfer limit';
}
