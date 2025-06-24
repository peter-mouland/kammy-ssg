/* Location: app/transfers/lib/transfer-rule-definitions.ts */

import type { BuiltInRuleDefinition, TransferRule } from '../types/transfer-rule-types';
import type { TransferType } from '../types/transfer-types';

/**
 * Built-in transfer rule definitions that can be configured per division
 */
export const BUILT_IN_TRANSFER_RULES: BuiltInRuleDefinition[] = [
    // ==========================================
    // TIMING RULES
    // ==========================================

    {
        id: 'minimum-gap-between-transfers',
        name: 'Minimum Gap Between Transfers',
        description: 'Minimum time required between transfers for the same manager',
        category: 'timing',
        defaultSeverity: 'warning',
        applicableTransferTypes: ['TRANSFER', 'SWAP', 'TRADE', 'NEW_PLAYER'],
        validationFunction: 'validateMinimumGap',
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
    },
];

/**
 * Default rule configuration for new divisions
 */
export function getDefaultRuleConfiguration(divisionId: string): TransferRule[] {
    return BUILT_IN_TRANSFER_RULES.map((ruleDef) => ({
        id: `${divisionId}_${ruleDef.id}`,
        name: ruleDef.name,
        description: ruleDef.description,
        category: ruleDef.category,
        severity: ruleDef.defaultSeverity,
        isActive: true, // Most rules active by default
        transferTypes: ruleDef.applicableTransferTypes,
        validationFunction: ruleDef.validationFunction,
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
