/* Location: app/admin/components/ui/draft-card.tsx */

import { useFetcher } from 'react-router';
import type { DivisionSheetData, UserTeamsSheetData } from '../../../_shared/types/league-types';
import type { DraftAction, DraftOrderData, DraftStateData, DraftStatusData } from '../../../draft';
import styles from './draft-card.module.css';

interface DraftCardProps {
    division: DivisionSheetData;
    teams: UserTeamsSheetData[];
    orders: DraftOrderData[];
    draftStates: DraftStateData[] | null;
    draftStatus: DraftStatusData | null;
}

type DraftVariant = 'generate' | 'start' | 'stop' | 'disabled';

interface DivisionStatus {
    status: string;
    color: string;
    disabled: boolean;
    action?: DraftAction;
    message?: string;
    variant: DraftVariant;
}

const getDivisionStatus = ({ teams, orders, draftState, draftStatus, division }: DraftCardProps): DivisionStatus[] => {
    const actions: DivisionStatus[] = [];
    if (teams.length === 0) {
        actions.push({
            status: 'No Teams',
            color: '#6b7280',
            disabled: true,
            variant: 'disabled',
            message: 'Go into google sheets and create some teams!',
        });
        return actions;
    }
    // division order
    if (orders.length === 0) {
        actions.push({
            status: '🎲 Generate Order',
            color: '#f59e0b',
            disabled: false,
            action: 'generateOrder',
            variant: 'generate',
        });
    } else {
        actions.push({
            status: '🎲 Order Generated',
            color: '#f59e0b',
            disabled: true,
            action: 'generateOrder',
            variant: 'generate',
            message: 'Make changes in google sheets (then flush the cache!)',
        });
    }
    if (draftState?.isActive) {
        actions.push({
            status: '⚪️ Open Draft',
            color: '#6b7280',
            disabled: true,
            variant: 'disabled',
        });
        actions.push({
            status: '🛑 Close Draft',
            color: '#ef4444',
            disabled: false,
            action: 'stopDraft',
            variant: 'stop',
        });
    } else {
        actions.push({
            status: '🟢️ Open Draft',
            color: '#6b7280',
            disabled: false,
            action: 'startDraft',
            variant: 'start',
        });

        actions.push({
            status: '⚪️ Close Draft',
            color: '#ef4444',
            disabled: true,
            action: 'stopDraft',
            variant: 'stop',
        });
    }
    if (draftStatus?.byDivision?.[division.id].isCommitted || draftState?.isActive) {
        actions.push({
            status: '⚪️ Commit Draft',
            color: '#6b7280',
            disabled: true,
            action: 'commitTeamsToFirestore',
            variant: 'generate',
        });
    } else {
        actions.push({
            status: '🟠️ Commit Draft',
            color: '#6b7280',
            disabled: false,
            action: 'commitTeamsToFirestore',
            variant: 'generate',
        });
    }
    return actions;
};

export const DraftCard = ({ division, teams, orders, draftStates, draftStatus }: DraftCardProps) => {
    const draftState = draftStates.find((s) => s.divisionId === division.id);
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

    const isActive = !!(draftState?.isActive && draftState.divisionId === division.id);
    const divisionStati = getDivisionStatus({ division, teams, orders, draftState, draftStatus });

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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                {divisionStati.map((divisionStatus, idx) => {
                    return (
                        <div>
                            <button
                                key={idx}
                                type={'button'}
                                onClick={() => divisionStatus.action && handleAction(divisionStatus.action)}
                                className={`${styles.draftButton} ${styles[divisionStatus.variant]}`}
                                disabled={divisionStatus.disabled || isLoading}
                            >
                                {isLoading ? 'Loading...' : divisionStatus.status}
                            </button>
                            {divisionStatus.message && <div className={styles.orderInfo}>{divisionStatus.message}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
