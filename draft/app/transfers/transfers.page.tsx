/* Location: app/transfers/transfers.page.tsx */

import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectDivision } from '../_shared/components/select-division';
import { TimeTravelBanner } from '../_shared/components/time-travel-banner';
import { GameweekSelector } from '../teams/components/gameweek-selector';
import { CurrentTransfers } from './components/current-transfers';
import { TransferForm } from './components/transfer-form';
import styles from './transfers.page.module.css';
import type { TransfersPageData } from './types/transfer-form-types';

export function TransfersPage() {
    const data = useLoaderData<TransfersPageData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const isCurrentGameweek =
        !searchParams.get('gameweek') || searchParams.get('gameweek') === String(data.currentGameweek);

    const handleDivisionChange = (divisionId: string) => {
        if (divisionId !== 'all') {
            navigate(`/transfers/${divisionId}?gameweek=${data.selectedGameweek}`);
        } else {
            navigate(`/transfers?gameweek=${data.selectedGameweek}`);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title={`${data.divisions.find((d) => d.id === data.selectedDivision)?.label} Transfers`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                        <GameweekSelector
                            currentGameweekData={data.currentGameweekData}
                            selectedGameweekData={data.selectedGameweekData}
                            availableGameweeks={data.availableGameweeks}
                        />
                        <SelectDivision
                            divisions={data.divisions}
                            selectedDivision={data.selectedDivision}
                            handleDivisionChange={handleDivisionChange}
                        />
                    </div>
                }
            />

            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}

            {/* Current Transfers Section */}
            <div className={"card"}>
                <CurrentTransfers
                    teamsByCode={data.teamsByCode}
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
                        selectedGameweekData={data.selectedGameweekData}
                        selectedDivision={data.selectedDivision}
                        selectedManager={data.selectedManager}
                        managerRoster={data.managerRoster}
                        availablePlayers={data.availablePlayers}
                        isBeforeDeadline={true /* data.isBeforeDeadline */}
                        divisionRosters={data.divisionRosters}
                        teamsByCode={data.teamsByCode}
                        validationContext={data.validationContext}
                    />
                </div>
            </div>
        </div>
    );
}
