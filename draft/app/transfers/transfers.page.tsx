/* Location: app/transfers/transfers.page.tsx */

import type * as React from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectUser } from '../_shared/components/select-user';
import { TimeTravelBanner } from '../_shared/components/time-travel-banner';
import { UserSelectionProvider } from '../_shared/features/user-selection/user-selection-provider';
import { GameweekSelector } from '../teams/components/gameweek-selector';
import type { ManagerId, PositionSlotKey, RosterPlayer } from '../teams/types/team-types';
import { CurrentTransfers } from './components/current-transfers';
import { LoanStatusDisplay } from './components/loan-status-display';
import { TransferForm } from './components/transfer-form';
import styles from './transfers.page.module.css';
import type { TransfersPageData } from './types/transfer-form-types';

type ActiveLoan = {
    player: RosterPlayer;
    to: ManagerId | null;
    from: ManagerId | null;
};

export const TransfersPage = () => {
    const data = useLoaderData<TransfersPageData>();
    return (
        <UserSelectionProvider
            users={data.userTeams}
            onUserSelected={console.log}
            redirectOnSelection={false} // Reload page with new user
            fallbackContent={
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>Welcome to Fantasy Football!</h2>
                    <p>Please select your profile to continue</p>
                </div>
            }
            initialSelection={data.persistedUser}
        >
            <TransfersPageComp {...data} />
        </UserSelectionProvider>
    );
};

export const TransfersPageComp = (data: TransfersPageData) => {
    const [searchParams, setSearchParams] = useSearchParams();
    // const navigate = useNavigate();
    const isCurrentGameweek =
        !searchParams.get('gameweek') || searchParams.get('gameweek') === String(data.currentGameweek);

    const loans: Record<RosterPlayer['playerCode'], ActiveLoan> = {};
    if (data.divisionRosters) {
        Object.keys(data.divisionRosters).forEach((managerId) => {
            const { roster } = data.divisionRosters[managerId];
            Object.keys(roster).forEach((slotKey) => {
                const player = roster[slotKey as PositionSlotKey].player;
                if (player.onLoanTo || player.onLoanFrom) {
                    loans[player.playerCode] = {
                        player,
                        to: loans[player.playerCode]?.to || player.onLoanTo,
                        from: loans[player.playerCode]?.from || player.onLoanFrom,
                    };
                }
            });
        });
    }

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title={`${data.divisions.find((d) => d.id === data.selectedDivision)?.label} Transfers`}
                actions={
                    <>
                        <SelectUser
                            selectedUser={data.selectedUser}
                            users={data.userTeams}
                            handleUserChange={(userId) => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set('userId', userId);
                                setSearchParams(newParams);
                            }}
                        />
                        <GameweekSelector
                            currentGameweekData={data.currentGameweekData}
                            selectedGameweekData={data.selectedGameweekData}
                            availableGameweeks={data.availableGameweeks}
                        />
                    </>
                }
            />

            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}

            {/* Current Transfers Section */}
            <div className={'card'}>
                {data.currentTransfers ? (
                    <CurrentTransfers
                        teamsByCode={data.teamsByCode}
                        transfers={data.currentTransfers}
                        currentGameweek={data.currentGameweek}
                        availableGameweeks={data.availableGameweeks}
                        selectedGameweek={data.selectedGameweek}
                        selectedDivision={data.selectedDivision}
                    />
                ) : null}
            </div>
            <br />
            <br />
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

                    {data.selectedUser ? (
                        <TransferForm
                            divisions={data.divisions}
                            managers={data.managers}
                            currentGameweek={data.currentGameweek}
                            availableGameweeks={data.availableGameweeks}
                            selectedGameweekData={data.selectedGameweekData}
                            selectedDivision={data.selectedDivision}
                            selectedManager={data.selectedUser}
                            managerRoster={data.managerRoster}
                            availablePlayers={data.availablePlayers}
                            isBeforeDeadline={true /* data.isBeforeDeadline */}
                            divisionRosters={data.divisionRosters}
                            teamsByCode={data.teamsByCode}
                            validationContext={data.validationContext}
                        />
                    ) : null}
                </div>
                <LoanStatusDisplay
                    teamsByCode={data.teamsByCode}
                    fplPlayersByCode={data.fplPlayersByCode}
                    loans={loans}
                    managers={data.managers}
                    currentManagerId={data.selectedUser}
                />
            </div>
        </div>
    );
};
