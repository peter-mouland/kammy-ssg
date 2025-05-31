import { useState } from 'react';
import styles from './points-breakdown-tooltip.module.css';
import type { EnhancedPlayerData } from '../server/cache/types';
import { isStatRelevant } from '../lib/is-stat-relevant';

interface PointsBreakdownTooltipProps {
    player: EnhancedPlayerData;
    children: React.ReactNode;
}

interface PointBreakdownItem {
    label: string;
    points: number;
    formula: string | string[];
    isRelevant: boolean;
}

// Calculate detailed breakdown using the pre-calculated explanations from server
const getPointsBreakdown = (player: PointsBreakdownTooltipProps['player']): PointBreakdownItem[] => {
    const position = player.position_name;
    const breakdown = player.points_breakdown || {};
    const explanations = player.points_explanations || {};

    const items: PointBreakdownItem[] = [
        {
            label: 'Minutes Played',
            points: breakdown.minutesPlayed || 0,
            formula: explanations.minutesPlayed,
            isRelevant: true
        },
        {
            label: 'Goals',
            points: breakdown.goals || 0,
            formula: explanations.goals,
            isRelevant: true
        },
        {
            label: 'Assists',
            points: breakdown.assists || 0,
            formula: explanations.assists,
            isRelevant: true
        },
        {
            label: 'Clean Sheets',
            points: breakdown.cleanSheets || 0,
            formula: isStatRelevant('clean_sheets', position)
                ? (explanations.cleanSheets)
                : 'N/A for position',
            isRelevant: isStatRelevant('clean_sheets', position)
        },
        {
            label: 'Yellow Cards',
            points: breakdown.yellowCards || 0,
            formula: explanations.yellowCards,
            isRelevant: true
        },
        {
            label: 'Red Cards',
            points: breakdown.redCards || 0,
            formula: explanations.redCards,
            isRelevant: true
        },
        {
            label: 'Bonus Points',
            points: breakdown.bonus || 0,
            formula: isStatRelevant('bonus', position)
                ? (explanations.bonus)
                : 'N/A for position',
            isRelevant: isStatRelevant('bonus', position)
        },
        {
            label: 'Saves',
            points: breakdown.saves || 0,
            formula: isStatRelevant('saves', position)
                ? (explanations.saves)
                : 'N/A for position',
            isRelevant: isStatRelevant('saves', position)
        },
        {
            label: 'Penalties Saved',
            points: breakdown.penaltiesSaved || 0,
            formula: isStatRelevant('penalties_saved', position)
                ? (explanations.penaltiesSaved)
                : 'N/A for position',
            isRelevant: isStatRelevant('penalties_saved', position)
        },
        {
            label: 'Goals Conceded',
            points: breakdown.goalsConceded || 0,
            formula: isStatRelevant('goals_conceded', position)
                ? (explanations.goalsConceded)
                : 'N/A for position',
            isRelevant: isStatRelevant('goals_conceded', position)
        }
    ];

    return items;
};

export function PointsBreakdownTooltip({ player, children }: PointsBreakdownTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const breakdown = getPointsBreakdown(player);
    const totalPoints = breakdown.reduce((sum, item) => sum + item.points, 0);

    return (
        <div
            className={styles.tooltipContainer}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            {isVisible && (
                <div className={styles.tooltip}>
                    <div className={styles.tooltipHeader}>
                        <h4 className={styles.playerName}>
                            {player.web_name} - Points Breakdown
                        </h4>
                        <div className={styles.position}>
                            {player.position_name}
                        </div>
                    </div>

                    <div className={styles.breakdownList}>
                        {breakdown.map((item) => (
                            <div
                                key={item.label}
                                className={`${styles.breakdownItem} ${!item.isRelevant ? styles.notRelevant : ''} ${item.points > 0 ? styles.positive : item.points < 0 ? styles.negative : styles.neutral}`}
                            >
                                <div className={styles.statLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.statFormula}>
                                    {Array.isArray(item.formula) ?
                                        item.formula.map((line, index) => (
                                            <div key={index}>{line}</div>
                                        )) :
                                        item.formula
                                    }
                                </div>
                                <div className={styles.statPoints}>
                                    {item.points > 0 ? '+' : ''}{item.points}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.tooltipFooter}>
                        <div className={styles.totalPoints}>
                            <strong>Total: {totalPoints} points</strong>
                        </div>
                    </div>

                    <div className={styles.tooltipArrow}></div>
                </div>
            )}
        </div>
    );
}
