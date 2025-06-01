import { useState } from 'react';
import styles from './points-breakdown-tooltip.module.css';
import type { EnhancedPlayerData } from '../types';

interface PointsBreakdownTooltipProps {
    player: EnhancedPlayerData;
    children: React.ReactNode;
}

const BreakdownItem = (item) => (
    <div
        key={item.label}
        className={`${styles.breakdownItem} ${!item.isRelevant ? styles.notRelevant : ''} ${item.points > 0 ? styles.positive : item.points < 0 ? styles.negative : styles.neutral}`}
    >
        <div className={styles.statLabel}>
            {item.label}
        </div>
        <div className={styles.statFormula}>
            {Array.isArray(item.formula) ? item.formula.map(i =>
                <div>{i}</div>) : item.formula}
        </div>
        <div className={styles.statPoints}>
            {item.points > 0 ? '+' : ''}{item.points}
        </div>
    </div>
);

export function PointsBreakdownTooltip({ player, children }: PointsBreakdownTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
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
                            {player.draft.position}
                        </div>
                    </div>

                    <div className={styles.breakdownList}>
                        <BreakdownItem {...player.draft.fullBreakdown.appearance} />
                        <BreakdownItem {...player.draft.fullBreakdown.goals} />
                        <BreakdownItem {...player.draft.fullBreakdown.assists} />
                        <BreakdownItem {...player.draft.fullBreakdown.cleanSheets} />
                        <BreakdownItem {...player.draft.fullBreakdown.goalsConceded} />
                        <BreakdownItem {...player.draft.fullBreakdown.yellowCards} />
                        <BreakdownItem {...player.draft.fullBreakdown.redCards} />
                        <BreakdownItem {...player.draft.fullBreakdown.saves} />
                        <BreakdownItem {...player.draft.fullBreakdown.bonus} />
                    </div>

                    <div className={styles.tooltipFooter}>
                        <div className={styles.totalPoints}>
                            <strong>Total: {player.draft.pointsTotal} points</strong>
                        </div>
                    </div>

                    <div className={styles.tooltipArrow}></div>
                </div>
            )}
        </div>
    );
}
