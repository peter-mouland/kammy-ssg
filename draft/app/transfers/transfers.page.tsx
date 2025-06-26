/* Location: app/transfers/transfers.page.tsx */

import { useLoaderData, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectDivision } from '../_shared/components/select-division';
import { GameweekSelector } from '../teams/components/gameweek-selector';
import { CurrentTransfers } from './components/current-transfers';
import { TransferForm } from './components/transfer-form';
import styles from './transfers.page.module.css';
import type { TransfersPageData } from './types/transfer-form-types';

export function TransfersPage() {
    const data = useLoaderData<TransfersPageData>();
    const [_searchParams, setSearchParams] = useSearchParams();

    const handleDivisionChange = (divisionId: string) => {
        const newParams = new URLSearchParams();
        if (divisionId !== 'all') {
            newParams.set('division', divisionId);
        }
        if (data.selectedGameweek !== data.currentGameweek) {
            newParams.set('gameweek', data.selectedGameweek.toString());
        }
        setSearchParams(newParams);
    };

    const handleGameweekChange = (gameweek: number) => {
        const newParams = new URLSearchParams();
        if (data.selectedDivision) {
            newParams.set('division', data.selectedDivision);
        }
        if (gameweek !== data.currentGameweek) {
            newParams.set('gameweek', gameweek.toString());
        }
        setSearchParams(newParams);
    };
    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title={`${data.divisions.find((d) => d.id === data.selectedDivision)?.label} Transfers`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                        <GameweekSelector
                            currentGameweek={data.currentGameweek}
                            selectedGameweek={data.selectedGameweek}
                            availableGameweeks={data.availableGameweeks}
                            onGameweekChange={handleGameweekChange}
                        />
                        <SelectDivision
                            divisions={data.divisions}
                            selectedDivision={data.selectedDivision}
                            handleDivisionChange={handleDivisionChange}
                        />
                    </div>
                }
            />

            {/* Current Transfers Section */}
            <div className={styles.transfersSection}>
                <CurrentTransfers
                    transfers={data.currentTransfers}
                    currentGameweek={data.currentGameweek}
                    availableGameweeks={data.availableGameweeks}
                    selectedGameweek={data.selectedGameweek}
                    selectedDivision={data.selectedDivision}
                />
            </div>
            <div>
                {/* Transfer Form Section */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Submit New Transfer</h2>
                        <div className={styles.deadlineInfo}>
                            <span className={styles.deadlineLabel}>Deadline:</span>
                            <span className={styles.deadlineValue}>{data.transferDeadline}</span>
                            {data.isBeforeDeadline ? (
                                <span className={styles.deadlineStatus}>✓ Open</span>
                            ) : (
                                <span className={styles.deadlineStatusClosed}>✗ Closed</span>
                            )}
                        </div>
                    </div>

                    <TransferForm
                        divisions={data.divisions}
                        managers={data.managers}
                        currentGameweek={data.currentGameweek}
                        availableGameweeks={data.availableGameweeks}
                        gameweekData={data.gameweekData}
                        selectedDivision={data.selectedDivision}
                        selectedManager={data.selectedManager}
                        managerRoster={data.managerRoster}
                        availablePlayers={data.availablePlayers}
                        isBeforeDeadline={data.isBeforeDeadline}
                    />
                </div>
            </div>
        </div>
    );
}
