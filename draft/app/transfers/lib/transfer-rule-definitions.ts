/* Location: app/transfers/lib/transfer-rule-definitions.ts */

import type { BuiltInRuleDefinition, RuleSeverity, TransferRuleCategory } from '../types/transfer-rule-types';
import type { TransferType } from '../types/transfer-types';

/**
 * Built-in transfer rule definitions that can be configured per division
 */
export const BUILT_IN_TRANSFER_RULES: BuiltInRuleDefinition[] = [
    // ==========================================
    // TIMING RULES
    // ==========================================
    {
        id: 'gameweek-deadline',
        name: 'Gameweek Deadline',
        description: 'Transfers must be submitted before gameweek deadline',
        category: 'timing',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'SWAP', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateGameweekDeadline',
        defaultParameters: {
            hoursBeforeDeadline: 2,
            allowEmergencyTransfers: false,
        },
        parameterSchema: {
            hoursBeforeDeadline: {
                type: 'number',
                label: 'Hours Before Deadline',
                description: 'Number of hours before gameweek deadline to stop accepting transfers',
                required: true,
                defaultValue: 2,
                min: 0,
                max: 168, // 1 week
            },
            allowEmergencyTransfers: {
                type: 'boolean',
                label: 'Allow Emergency Transfers',
                description: 'Allow transfers after deadline in emergency situations',
                required: true,
                defaultValue: false,
            },
        },
    },

    {
        id: 'minimum-gap-between-transfers',
        name: 'Minimum Gap Between Transfers',
        description: 'Minimum time required between transfers for the same manager',
        category: 'timing',
        defaultSeverity: 'warning',
        applicableTransferTypes: ['TRANSFER', 'SWAP', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateMinimumGap',
        defaultParameters: {
            minimumHours: 24,
            samePlayerHours: 72,
        },
        parameterSchema: {
            minimumHours: {
                type: 'number',
                label: 'Minimum Hours Between Any Transfers',
                description: 'Minimum hours between any two transfers by the same manager',
                required: true,
                defaultValue: 24,
                min: 0,
                max: 168,
            },
            samePlayerHours: {
                type: 'number',
                label: 'Minimum Hours for Same Player',
                description: 'Minimum hours before transferring the same player again',
                required: true,
                defaultValue: 72,
                min: 0,
                max: 336, // 2 weeks
            },
        },
    },

    // ==========================================
    // ELIGIBILITY RULES
    // ==========================================
    {
        id: 'player-availability',
        name: 'Player Availability',
        description: 'Player must be available and not owned by another manager',
        category: 'eligibility',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validatePlayerAvailability',
        defaultParameters: {},
        parameterSchema: {},
    },

    {
        id: 'injury-status',
        name: 'Injury Status Check',
        description: 'Check if player is injured or suspended',
        category: 'eligibility',
        defaultSeverity: 'advisory',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateInjuryStatus',
        defaultParameters: {
            blockSuspended: true,
            blockInjured: false,
            warnOnInjury: true,
        },
        parameterSchema: {
            blockSuspended: {
                type: 'boolean',
                label: 'Block Suspended Players',
                description: 'Prevent transfers of suspended players',
                required: true,
                defaultValue: true,
            },
            blockInjured: {
                type: 'boolean',
                label: 'Block Injured Players',
                description: 'Prevent transfers of injured players',
                required: true,
                defaultValue: false,
            },
            warnOnInjury: {
                type: 'boolean',
                label: 'Warn on Injury',
                description: 'Show warning when transferring injured players',
                required: true,
                defaultValue: true,
            },
        },
    },

    // ==========================================
    // ROSTER RULES
    // ==========================================
    {
        id: 'position-limits',
        name: 'Position Limits',
        description: 'Ensure roster maintains required position limits',
        category: 'roster',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validatePositionLimits',
        defaultParameters: {
            maxGoalkeepers: 1,
            maxDefenders: 4,
            maxMidfielders: 4,
            maxAttackers: 4,
            minGoalkeepers: 1,
            minDefenders: 2,
            minMidfielders: 2,
            minAttackers: 2,
        },
        parameterSchema: {
            maxGoalkeepers: {
                type: 'number',
                label: 'Max Goalkeepers',
                description: 'Maximum number of goalkeepers allowed',
                required: true,
                defaultValue: 1,
                min: 1,
                max: 3,
            },
            maxDefenders: {
                type: 'number',
                label: 'Max Defenders',
                description: 'Maximum number of defenders allowed',
                required: true,
                defaultValue: 4,
                min: 2,
                max: 8,
            },
            // ... similar for other positions
        },
    },

    {
        id: 'squad-size',
        name: 'Squad Size Limits',
        description: 'Ensure squad size stays within limits',
        category: 'roster',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateSquadSize',
        defaultParameters: {
            minSquadSize: 11,
            maxSquadSize: 12,
        },
        parameterSchema: {
            minSquadSize: {
                type: 'number',
                label: 'Minimum Squad Size',
                description: 'Minimum number of players in squad',
                required: true,
                defaultValue: 11,
                min: 11,
                max: 15,
            },
            maxSquadSize: {
                type: 'number',
                label: 'Maximum Squad Size',
                description: 'Maximum number of players in squad',
                required: true,
                defaultValue: 12,
                min: 11,
                max: 15,
            },
        },
    },

    // ==========================================
    // GAMEWEEK RULES
    // ==========================================
    {
        id: 'transfer-limit-per-gameweek',
        name: 'Transfer Limit Per Gameweek',
        description: 'Limit number of transfers per manager per gameweek',
        category: 'gameweek',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateGameweekTransferLimit',
        defaultParameters: {
            maxTransfersPerGameweek: 2,
            countPendingTransfers: true,
        },
        parameterSchema: {
            maxTransfersPerGameweek: {
                type: 'number',
                label: 'Max Transfers Per Gameweek',
                description: 'Maximum number of transfers allowed per gameweek',
                required: true,
                defaultValue: 2,
                min: 1,
                max: 10,
            },
            countPendingTransfers: {
                type: 'boolean',
                label: 'Count Pending Transfers',
                description: 'Include pending transfers in the count',
                required: true,
                defaultValue: true,
            },
        },
    },

    // ==========================================
    // POSITION RULES
    // ==========================================
    {
        id: 'position-compatibility',
        name: 'Position Compatibility',
        description: 'Ensure transferred player fits the position slot',
        category: 'position',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validatePositionCompatibility',
        defaultParameters: {
            strictPositionMatch: false,
            allowSubstitution: true,
        },
        parameterSchema: {
            strictPositionMatch: {
                type: 'boolean',
                label: 'Strict Position Match',
                description: 'Require exact position match (no flexibility)',
                required: true,
                defaultValue: false,
            },
            allowSubstitution: {
                type: 'boolean',
                label: 'Allow Substitution',
                description: 'Allow players to be moved to substitute bench',
                required: true,
                defaultValue: true,
            },
        },
    },

    // ==========================================
    // BUSINESS RULES
    // ==========================================
    {
        id: 'manager-active-status',
        name: 'Manager Active Status',
        description: 'Only active managers can make transfers',
        category: 'business',
        defaultSeverity: 'blocking',
        applicableTransferTypes: ['TRANSFER', 'SWAP', 'TRADE', 'LOAN_START', 'LOAN_FINISH', 'NEW_PLAYER'],
        validationFunction: 'validateManagerActiveStatus',
        defaultParameters: {
            requireActiveStatus: true,
            gracePeriodDays: 7,
        },
        parameterSchema: {
            requireActiveStatus: {
                type: 'boolean',
                label: 'Require Active Status',
                description: 'Only allow transfers from active managers',
                required: true,
                defaultValue: true,
            },
            gracePeriodDays: {
                type: 'number',
                label: 'Grace Period (Days)',
                description: 'Days to allow transfers after manager becomes inactive',
                required: true,
                defaultValue: 7,
                min: 0,
                max: 30,
            },
        },
    },

    {
        id: 'league-specific-restrictions',
        name: 'League Specific Restrictions',
        description: 'Custom restrictions specific to league rules',
        category: 'business',
        defaultSeverity: 'warning',
        applicableTransferTypes: ['TRANSFER', 'SWAP', 'TRADE', 'LOAN_START', 'LOAN_FINISH', 'NEW_PLAYER'],
        validationFunction: 'validateLeagueRestrictions',
        defaultParameters: {
            enableCustomRestrictions: false,
            restrictionMessage: 'Custom league restriction applies',
        },
        parameterSchema: {
            enableCustomRestrictions: {
                type: 'boolean',
                label: 'Enable Custom Restrictions',
                description: 'Apply custom restrictions for this league',
                required: true,
                defaultValue: false,
            },
            restrictionMessage: {
                type: 'string',
                label: 'Restriction Message',
                description: 'Message to show when restriction applies',
                required: false,
                defaultValue: 'Custom league restriction applies',
            },
        },
    },
];

/**
 * Default rule configuration for new divisions
 */
export function getDefaultRuleConfiguration(divisionId: string): TransferRule[] {
    return BUILT_IN_TRANSFER_RULES.map((ruleDef, index) => ({
        id: `${divisionId}_${ruleDef.id}`,
        name: ruleDef.name,
        description: ruleDef.description,
        category: ruleDef.category,
        severity: ruleDef.defaultSeverity,
        isActive: true, // Most rules active by default
        transferTypes: ruleDef.applicableTransferTypes,
        validationFunction: ruleDef.validationFunction,
        parameters: { ...ruleDef.defaultParameters },
    }));
}

/**
 * Get rule definition by ID
 */
export function getRuleDefinition(ruleId: string): BuiltInRuleDefinition | null {
    return BUILT_IN_TRANSFER_RULES.find((rule) => rule.id === ruleId) || null;
}

/**
 * Get rules applicable to a specific transfer type
 */
export function getRulesForTransferType(transferType: TransferType): BuiltInRuleDefinition[] {
    return BUILT_IN_TRANSFER_RULES.filter((rule) => rule.applicableTransferTypes.includes(transferType));
}
