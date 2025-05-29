import { Form } from "react-router";
import styles from './division-card.module.css';
import type { DivisionData, UserTeamData, DraftOrderData, DraftStateData } from "../types";

interface DivisionCardProps {
    division: DivisionData;
    teams: UserTeamData[];
    orders: DraftOrderData[];
    draftState: DraftStateData | null;
}

interface DivisionStatus {
    status: string;
    color: string;
    disabled: boolean;
    action?: string;
    variant: 'generate' | 'start' | 'stop' | 'disabled';
}

const getDivisionStatus = (
    divisionId: string,
    teams: UserTeamData[],
    orders: DraftOrderData[],
    isActive: boolean,
    hasActiveDraft: boolean
): DivisionStatus => {
    if (teams.length === 0) {
        return {
            status: "No Teams",
            color: "#6b7280",
            disabled: true,
            variant: 'disabled'
        };
    }

    if (orders.length === 0) {
        return {
            status: "🎲 Generate Order",
            color: "#f59e0b",
            disabled: false,
            action: "generateOrder",
            variant: 'generate'
        };
    }

    if (isActive) {
        return {
            status: "🛑 Stop Draft",
            color: "#ef4444",
            disabled: false,
            action: "stopDraft",
            variant: 'stop'
        };
    }

    if (hasActiveDraft) {
        return {
            status: "⚪️ Start Draft",
            color: "#6b7280",
            disabled: true,
            action: "startDraft",
            variant: 'disabled'
        };
    }

    return {
        status: "🟢 Start Draft",
        color: "#10b981",
        disabled: false,
        action: "startDraft",
        variant: 'start'
    };
};

// Fix hydration issue with consistent date formatting
const formatDate = (dateString: string | Date): string => {
    try {
        const date = new Date(dateString);
        // Use a consistent format that doesn't depend on locale
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
        return 'Invalid date';
    }
};

export function DivisionCard({ division, teams, orders, draftState }: DivisionCardProps) {
    const isActive = !!(draftState?.isActive && draftState.currentDivisionId === division.id);
    const divisionStatus = getDivisionStatus(
        division.id,
        teams,
        orders,
        isActive,
        draftState?.isActive || false
    );

    const cardClasses = [
        styles.divisionCard,
        isActive ? styles.active : ''
    ].filter(Boolean).join(' ');

    const titleClasses = [
        styles.divisionTitle,
        isActive ? styles.active : ''
    ].filter(Boolean).join(' ');

    const buttonClasses = [
        styles.actionButton,
        styles[divisionStatus.variant]
    ].join(' ');

    return (
        <div className={cardClasses}>
            <div className={styles.divisionHeader}>
                <div className={styles.divisionTitleRow}>
                    <h3 className={titleClasses}>
                        {isActive && <span className={styles.activeIndicator}>🟢 </span>}
                        {division.label}
                    </h3>
                    <Form method="post" style={{ display: 'inline' }}>
                        <input type="hidden" name="divisionId" value={division.id} />
                        <button
                            type="submit"
                            className={buttonClasses}
                            name="actionType"
                            value={divisionStatus.action}
                            disabled={divisionStatus.disabled}
                        >
                            {divisionStatus.status}
                        </button>
                    </Form>
                </div>

                <div className={styles.divisionStats}>
                    {teams.length} teams {orders.length > 0 ? '' : ' • No order yet'}
                </div>
            </div>

            {/* Draft Order */}
            {orders.length > 0 && (
                <div className={styles.draftOrderSection}>
                    <h4 className={styles.draftOrderTitle}>
                        Draft Order:
                    </h4>
                    <div className={styles.draftOrderList}>
                        {orders.map((order) => (
                            <div key={order.userId} className={styles.draftOrderItem}>
                                <span className={styles.draftOrderPosition}>#{order.position}</span> {order.userName}
                            </div>
                        ))}
                    </div>
                    <div className={styles.draftOrderMeta}>
                        Generated: {formatDate(orders[0]?.generatedAt)}
                    </div>
                </div>
            )}

            {teams.length === 0 && (
                <div className={styles.emptyState}>
                    No teams in this division yet
                </div>
            )}
        </div>
    );
}
