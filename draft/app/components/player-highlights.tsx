// app/components/player-highlights.tsx
import { formatPointsDisplay } from '../lib/scoring';
import styles from './player-highlights.module.css';

interface PlayerHighlightsProps {
    player: any;
    seasonTotals: any;
    currentGameweek: number;
    position: string;
}

export function PlayerHighlights({
                                     player,
                                     seasonTotals,
                                     currentGameweek,
                                     position
                                 }: PlayerHighlightsProps) {
    const form = parseFloat(player.form || '0');
    const positionLower = position.toLowerCase();

    return (
        <div className={styles.highlightsContainer}>
            {/* Key Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Custom Points"
                    value={formatPointsDisplay(seasonTotals.totalCustomPoints)}
                    subtitle={`Avg: ${seasonTotals.averageCustomPoints}/game`}
                    className={styles.customPoints}
                />

                <StatCard
                    title="FPL Points"
                    value={seasonTotals.totalFplPoints.toString()}
                    subtitle={`Avg: ${seasonTotals.averageFplPoints}/game`}
                    className={styles.fplPoints}
                />

                <StatCard
                    title="Games Played"
                    value={seasonTotals.gamesPlayed.toString()}
                    subtitle={`${seasonTotals.averageMinutes} min/game`}
                    className={styles.games}
                />

                <StatCard
                    title="Form"
                    value={form.toFixed(1)}
                    subtitle="Last 5 games"
                    className={form >= 4 ? styles.goodForm : form <= 2 ? styles.poorForm : styles.averageForm}
                />
            </div>

            {/* Performance Highlights - Compact Visual */}
            <div className={styles.performanceSection}>
                <h3 className={styles.sectionTitle}>Season Performance</h3>

                <div className={styles.performanceBars}>
                    {/* Attack */}
                    <div className={styles.performanceBar}>
                        <div className={styles.barHeader}>
                            <span className={styles.barLabel}>⚽ Attack</span>
                            <span className={styles.barValue}>{seasonTotals.goals + seasonTotals.assists} G+A</span>
                        </div>
                        <div className={styles.barContainer}>
                            <div className={styles.barSegment} style={{width: `${Math.min(seasonTotals.goals * 5, 70)}%`, backgroundColor: '#059669'}}>
                                <span className={styles.segmentLabel}>{seasonTotals.goals}G</span>
                            </div>
                            <div className={styles.barSegment} style={{width: `${Math.min(seasonTotals.assists * 5, 30)}%`, backgroundColor: '#0891b2'}}>
                                <span className={styles.segmentLabel}>{seasonTotals.assists}A</span>
                            </div>
                        </div>
                    </div>

                    {/* Defensive (if relevant) */}
                    {(positionLower === 'gk' || positionLower === 'fb' || positionLower === 'cb') && (
                        <div className={styles.performanceBar}>
                            <div className={styles.barHeader}>
                                <span className={styles.barLabel}>🛡️ Defense</span>
                                <span className={styles.barValue}>{seasonTotals.cleanSheets} CS ({seasonTotals.cleanSheetPercentage}%)</span>
                            </div>
                            <div className={styles.barContainer}>
                                <div className={styles.barFull} style={{
                                    width: `${seasonTotals.cleanSheetPercentage}%`,
                                    backgroundColor: seasonTotals.cleanSheetPercentage >= 50 ? '#059669' : seasonTotals.cleanSheetPercentage >= 30 ? '#d97706' : '#dc2626'
                                }}>
                                    <span className={styles.segmentLabel}>{seasonTotals.cleanSheetPercentage}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Minutes/Availability */}
                    <div className={styles.performanceBar}>
                        <div className={styles.barHeader}>
                            <span className={styles.barLabel}>⏱️ Availability</span>
                            <span className={styles.barValue}>{seasonTotals.gamesPlayed} games ({seasonTotals.averageMinutes}min avg)</span>
                        </div>
                        <div className={styles.barContainer}>
                            <div className={styles.barFull} style={{
                                width: `${Math.min((seasonTotals.averageMinutes / 90) * 100, 100)}%`,
                                backgroundColor: seasonTotals.averageMinutes >= 70 ? '#059669' : seasonTotals.averageMinutes >= 45 ? '#d97706' : '#dc2626'
                            }}>
                                <span className={styles.segmentLabel}>{seasonTotals.averageMinutes}min</span>
                            </div>
                        </div>
                    </div>

                    {/* Discipline (compact) */}
                    <div className={styles.disciplineCompact}>
                        <span className={styles.disciplineItem}>
                            <span className={styles.disciplineIcon}>🟨</span>
                            {seasonTotals.yellowCards}
                        </span>
                        <span className={styles.disciplineItem}>
                            <span className={styles.disciplineIcon}>🟥</span>
                            {seasonTotals.redCards}
                        </span>
                        {seasonTotals.bonus > 0 && (
                            <span className={styles.disciplineItem}>
                                <span className={styles.disciplineIcon}>⭐</span>
                                {seasonTotals.bonus}
                            </span>
                        )}
                        {positionLower === 'gk' && seasonTotals.saves > 0 && (
                            <span className={styles.disciplineItem}>
                                <span className={styles.disciplineIcon}>🥅</span>
                                {seasonTotals.saves}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Insights */}
            <div className={styles.insightsSection}>
                <h3 className={styles.sectionTitle}>Quick Insights</h3>
                <div className={styles.insights}>
                    <QuickInsight
                        icon="⚽"
                        text={getGoalInsight(seasonTotals.goals, positionLower)}
                    />
                    <QuickInsight
                        icon="🎯"
                        text={getPointsInsight(seasonTotals.totalCustomPoints, seasonTotals.gamesPlayed)}
                    />
                    <QuickInsight
                        icon="📈"
                        text={getFormInsight(form)}
                    />
                    <QuickInsight
                        icon="⏱️"
                        text={getMinutesInsight(seasonTotals.totalMinutes, seasonTotals.gamesPlayed)}
                    />
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    className?: string;
}

function StatCard({ title, value, subtitle, className = '' }: StatCardProps) {
    return (
        <div className={`${styles.statCard} ${className}`}>
            <h3 className={styles.statTitle}>{title}</h3>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statSubtitle}>{subtitle}</div>
        </div>
    );
}

interface QuickInsightProps {
    icon: string;
    text: string;
}

function QuickInsight({ icon, text }: QuickInsightProps) {
    return (
        <div className={styles.insight}>
            <span className={styles.insightIcon}>{icon}</span>
            <span className={styles.insightText}>{text}</span>
        </div>
    );
}

// Helper functions for generating insights
function getGoalInsight(goals: number, position: string): string {
    if (position === 'gk') {
        return goals > 0 ? `Rare goal scorer with ${goals} goals` : 'Focused on keeping clean sheets';
    }
    if (position === 'fb' || position === 'cb') {
        if (goals >= 5) return `Excellent attacking threat with ${goals} goals`;
        if (goals >= 2) return `Decent attacking contribution with ${goals} goals`;
        return 'Defensively focused player';
    }
    if (goals >= 15) return `Prolific scorer with ${goals} goals`;
    if (goals >= 10) return `Good goal return with ${goals} goals`;
    if (goals >= 5) return `Moderate goal threat with ${goals} goals`;
    return 'More of a creator than scorer';
}

function getPointsInsight(totalPoints: number, gamesPlayed: number): string {
    const avgPoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    if (avgPoints >= 8) return 'Premium performer - consistent high scores';
    if (avgPoints >= 6) return 'Reliable performer - good value pick';
    if (avgPoints >= 4) return 'Decent performer - budget option';
    return 'Inconsistent performer - risky pick';
}

function getFormInsight(form: number): string {
    if (form >= 5) return 'Red hot form - must have player';
    if (form >= 3.5) return 'Good form - worth considering';
    if (form >= 2) return 'Average form - monitor closely';
    return 'Poor form - avoid for now';
}

function getMinutesInsight(totalMinutes: number, gamesPlayed: number): string {
    const avgMinutes = gamesPlayed > 0 ? totalMinutes / gamesPlayed : 0;
    if (avgMinutes >= 80) return 'Guaranteed starter - rarely substituted';
    if (avgMinutes >= 60) return 'Regular starter - good playing time';
    if (avgMinutes >= 30) return 'Squad rotation risk - inconsistent minutes';
    return 'Bench player - limited game time';
}
