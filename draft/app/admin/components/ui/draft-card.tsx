import React from 'react';
import { useFetcher } from 'react-router';
import styles from './draft-card.module.css';

interface DivisionData {
    id: string;
    label: string;
}

interface UserTeamData {
    userId: string;
    userName: string;
}

interface DraftOrderData {
    position: number;
    userId: string;
}

interface DraftStateData {
    isActive: boolean;
    currentDivisionId?: string;
}

interface DraftCardProps {
    division: DivisionData;
    teams: UserTeamData[];
    orders: DraftOrderData[];
    draftState: DraftStateData | null;
}

type DraftVariant = 'generate' | 'start' | 'stop' | 'disabled';

interface DivisionStatus {
    status: string;
    color: string;
    disabled: boolean;
    action?: string;
    variant: DraftVariant;
}

export const DraftCard = ({ division, teams, orders, draftState }: DraftCardProps) => {
    const fetcher = useFetcher();
    const isLoading = fetcher.state === "submitting";

    const handleAction = (actionType: string) => {
        fetcher.submit(
            { actionType, divisionId: division.id },
            { method: "post" }
        );
    };

    const isActive = !!(draftState?.isActive && draftState.currentDivisionId === division.id);

    const getDivisionStatus = (): DivisionStatus => {
        if (teams.length === 0) {
            return { status: "No Teams", color: "#6b7280", disabled: true, variant: 'disabled' };
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
        if (draftState?.isActive) {
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

    const divisionStatus = getDivisionStatus();

    return (
        <div className={`${styles.divisionCard} ${isActive ? styles.active : ''}`}>
            <div className={styles.divisionHeader}>
                <div>
                    <h3 className={`${styles.divisionTitle} ${isActive ? styles.active : ''}`}>
                        {isActive && '🟢 '}
                        {division.label}
                    </h3>
                    <div className={styles.divisionStats}>
                        {teams.length} teams {orders.length > 0 ? '' : ' • No order yet'}
                    </div>
                </div>
                <button
                    onClick={() => divisionStatus.action && handleAction(divisionStatus.action)}
                    className={`${styles.draftButton} ${styles[divisionStatus.variant]}`}
                    disabled={divisionStatus.disabled || isLoading}
                >
                    {isLoading ? 'Loading...' : divisionStatus.status}
                </button>
            </div>

            {orders.length > 0 && (
                <div className={styles.orderInfo}>
                    Draft order generated • {orders.length} teams
                </div>
            )}
        </div>
    );
};
