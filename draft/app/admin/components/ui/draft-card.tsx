/* Location: app/admin/components/ui/draft-card.tsx */

import { useFetcher } from 'react-router';
import type { DraftOrderData, DraftStateData, DraftStatusData } from '../../../draft/types/draft-types';
import type { DivisionSheetData, UserTeamsSheetData } from '../../../teams/types/team-types';
import styles from './draft-card.module.css';

interface DraftCardProps {
    division: DivisionSheetData;
    teams: UserTeamsSheetData[];
    orders: DraftOrderData[];
    draftState: DraftStateData | null;
    draftStatus: DraftStatusData | null;
}

type DraftVariant = 'generate' | 'start' | 'stop' | 'disabled';
type DraftAction = 'generateOrder' | 'startDraft' | 'stopDraft' | 'commitTeamsToFirestore';

interface DivisionStatus {
    status: string;
    color: string;
    disabled: boolean;
    action?: DraftAction;
    variant: DraftVariant;
}

const getDivisionStatus = ({ teams, orders, draftState, draftStatus, division }: DraftCardProps): DivisionStatus => {
    console.log({ draftState, draftStatus });
    if (teams.length === 0) {
        return { status: 'No Teams', color: '#6b7280', disabled: true, variant: 'disabled' };
    } else if (orders.length === 0) {
        // division order
        return {
            status: '🎲 Generate Order',
            color: '#f59e0b',
            disabled: false,
            action: 'generateOrder',
            variant: 'generate',
        };
    } else if (draftState?.isActive && draftState.currentDivisionId === division.id) {
        return {
            status: '🛑 Stop Draft',
            color: '#ef4444',
            disabled: false,
            action: 'stopDraft',
            variant: 'stop',
        };
    } else if (draftState?.isActive && draftState.currentDivisionId !== division.id) {
        return {
            status: '⚪️ Start Draft',
            color: '#6b7280',
            disabled: true,
            variant: 'disabled',
        };
    } else if (!draftState?.completedAt && !draftState?.isActive) {
        return {
            status: '🟢️ Start Draft',
            color: '#6b7280',
            disabled: false,
            action: 'startDraft',
            variant: 'start',
        };
    } else if (!draftStatus?.byDivision?.[division.id].isCommitted) {
        return {
            status: '🟠️ Commit Draft',
            color: '#6b7280',
            disabled: false,
            action: 'commitTeamsToFirestore',
            variant: 'generate',
        };
    }
    return {
        status: 'Draft Complete',
        color: '#10b981',
        variant: 'disabled',
        disabled: true,
    };
};

export const DraftCard = ({ division, teams, orders, draftState, draftStatus }: DraftCardProps) => {
    const fetcher = useFetcher();
    const isLoading = fetcher.state === 'submitting';
    const handleAction = (action: string) => {
        const formData = new FormData();
        formData.append('actionType', 'processDraft');
        formData.append('draftAction', action);
        formData.append('divisionId', division.id);

        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // Submit to parent route
        });
    };

    const isActive = !!(draftState?.isActive && draftState.currentDivisionId === division.id);
    const divisionStatus = getDivisionStatus({ division, teams, orders, draftState, draftStatus });

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
                    type={'button'}
                    onClick={() => divisionStatus.action && handleAction(divisionStatus.action)}
                    className={`${styles.draftButton} ${styles[divisionStatus.variant]}`}
                    disabled={divisionStatus.disabled || isLoading}
                >
                    {isLoading ? 'Loading...' : divisionStatus.status}
                </button>
            </div>

            {orders.length > 0 && <div className={styles.orderInfo}>Draft order generated • {orders.length} teams</div>}
        </div>
    );
};
