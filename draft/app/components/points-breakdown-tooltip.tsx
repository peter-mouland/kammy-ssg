import { useState } from 'react';
import styles from './points-breakdown-tooltip.module.css';
import type { EnhancedPlayerData } from '../server/player-stats.server';
import { isStatRelevant } from '../lib/is-stat-relevant';
import { POSITION_RULES } from '../lib/points';

interface PointsBreakdownTooltipProps {
    player: EnhancedPlayerData;
    children: React.ReactNode;
}

interface PointBreakdownItem {
    label: string;
    value: number;
    points: number;
    formula: string;
    isRelevant: boolean;
}

// Calculate detailed breakdown using the actual points breakdown from server
const getPointsBreakdown = (player: PointsBreakdownTooltipProps['player']): PointBreakdownItem[] => {
    const position = player.position_name;
    const breakdown = player.points_breakdown || {};
    const rules = POSITION_RULES[position.toLowerCase() as keyof typeof POSITION_RULES] || {} // ?????
    const items: PointBreakdownItem[] = [
        {
            label: 'Appearance',
            value: player.gameweek_data?.length || 0,
            points: breakdown.appearance || 0,
            formula: player.gameweek_data ?
                `${player.gameweek_data.filter(g => g.minutes >= 45).length} games (45+ min) × ${rules.appearance.over45Min}pts + ${player.gameweek_data.filter(g => g.minutes > 0 && g.minutes < 45).length} games (<45 min) × ${rules.appearance.under45Min}pt` :
                `${breakdown.appearance || 0} pts`,
            isRelevant: true
        },
        {
            label: 'Goals',
            value: player.goals_scored,
            points: breakdown.goals || 0,
            formula: `${player.goals_scored} goals × ${rules.goalPoints} pts`,
            isRelevant: true
        },
        {
            label: 'Assists',
            value: player.assists,
            points: breakdown.assists || 0,
            formula: `${player.assists} × ${rules.assists} pts`,
            isRelevant: true
        },
        {
            label: 'Clean Sheets',
            value: player.clean_sheets,
            points: breakdown.cleanSheets || 0,
            formula: isStatRelevant('clean_sheets', position) ?
                `${player.clean_sheets} × ${rules.cleanSheetPoints} pts` :
                'N/A for position',
            isRelevant: isStatRelevant('clean_sheets', position)
        },
        {
            label: 'Yellow Cards',
            value: player.yellow_cards,
            points: breakdown.yellowCards || 0,
            formula: `${player.yellow_cards} × ${rules.yellowCard} pt`,
            isRelevant: true
        },
        {
            label: 'Red Cards',
            value: player.red_cards,
            points: breakdown.redCards || 0,
            formula: `${player.red_cards} × ${rules.redCardPenalty} pts`,
            isRelevant: true
        },
        {
            label: 'Bonus Points',
            value: player.bonus,
            points: breakdown.bonus || 0,
            formula: isStatRelevant('bonus', position) ?
                `${player.bonus} bonus pts` :
                'N/A for position',
            isRelevant: isStatRelevant('bonus', position)
        },
        {
            label: 'Saves',
            value: player.saves,
            points: breakdown.saves || 0,
            formula: isStatRelevant('saves', position) ?
                `${player.saves} saves ÷ ${rules.savesThreshold} = ${Math.floor(player.saves / rules.savesThreshold)} pts` :
                'N/A for position',
            isRelevant: isStatRelevant('saves', position)
        },
        {
            label: 'Goals Conceded',
            value: player.goals_conceded,
            points: breakdown.goalsConceded || 0,
            formula: isStatRelevant('goals_conceded', position) ?
                `${player.goals_conceded} conceded = ${breakdown.goalsConceded || 0} pts` :
                'N/A for position',
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
            // onMouseLeave={() => setIsVisible(false)}
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
                        {breakdown.map((item, index) => (
                            <div
                                key={index}
                                className={`${styles.breakdownItem} ${!item.isRelevant ? styles.notRelevant : ''} ${item.points > 0 ? styles.positive : item.points < 0 ? styles.negative : styles.neutral}`}
                            >
                                <div className={styles.statLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.statFormula}>
                                    {item.formula}
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
