// app/teams/components/team-view.tsx

import type * as React from 'react';
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../../_shared/components/page-header';
import { SelectUser } from '../../_shared/components/select-user';
import { TimeTravelBanner } from '../../_shared/components/time-travel-banner';
import { UserSelectionProvider } from '../../_shared/features/user-selection/user-selection-provider';
import type { StatsViewMode, TeamViewData } from '../types/team-types';
import type { TeamViewTab } from '../types/team-view-types';
import { GameweekSelector } from './gameweek-selector';
import styles from './team-view.module.css';
import { TeamOfTheWeek } from './team-of-the-week';
import { AllTeamsView } from './team-view-all-teams';
import { MyTeamView } from './team-view-my-team';
import { TeamViewTabs } from './team-view-tabs';

export const TeamView = () => {
    const data = useLoaderData<TeamViewData>();

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
            <TeamViewComp data={data} />
        </UserSelectionProvider>
    );
};

export const TeamViewComp = ({ data }: { data: TeamViewData }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const selectedGameweek = data.selectedGameweekData.fplEvent.id;

    // Get active tab from URL or default to 'my-team'
    const activeTab = (searchParams.get('tab') as TeamViewTab) || 'my-team';

    // Derive view mode from URL: ?gameweek=season means season view
    const isSeasonView = searchParams.get('gameweek') === 'season';
    const viewMode: StatsViewMode = isSeasonView ? 'season' : 'gameweek';

    const handleTabChange = (tab: TeamViewTab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', tab);
        setSearchParams(newParams);
    };

    const isCurrentGameweek = !isSeasonView && selectedGameweek === data.currentGameweek;

    if (!data.currentUser || !data.division) {
        return (
            <>
                {/* Header */}
                <PageHeader
                    title={'unknown user'}
                    actions={
                        <>
                            <SelectUser
                                selectedUser={''}
                                users={data.userTeams || []}
                                handleUserChange={(userId) => {
                                    navigate(`/teams/${userId}?tab=all-teams`);
                                }}
                            />
                            <GameweekSelector
                                currentGameweekData={data.currentGameweekData}
                                selectedGameweekData={isSeasonView ? data.currentGameweekData : data.selectedGameweekData}
                                availableGameweeks={data.availableGameweeks}
                                showSeasonOption
                                isSeasonSelected={isSeasonView}
                            />
                        </>
                    }
                />
                {/* Time Travel Indicator */}
                {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}
                {/* Tab Navigation */}
                <TeamViewTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    playerCount={data.allTeamsData?.totalPlayers}
                />
            </>
        );
    }

    return (
        <>
            {/* Header */}

            <PageHeader
                title={data.currentUser.userName}
                subTitle={
                    <Link to={`/leagues/${data.division.id}`} className={styles.divisionBadge}>
                        {data.division.label}
                    </Link>
                }
                actions={
                    <>
                        <SelectUser
                            selectedUser={data.currentUser.userName}
                            users={data.userTeams || []}
                            handleUserChange={(userId) => {
                                navigate(`/teams/${userId}?tab=all-teams`);
                            }}
                        />
                        <GameweekSelector
                            currentGameweekData={data.currentGameweekData}
                            selectedGameweekData={isSeasonView ? data.currentGameweekData : data.selectedGameweekData}
                            availableGameweeks={data.availableGameweeks}
                            showSeasonOption
                            isSeasonSelected={isSeasonView}
                        />
                    </>
                }
            />

            {/* Time Travel Indicator */}
            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}

            {/*/!* Tab Navigation *!/*/}
            <TeamViewTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                playerCount={data.allTeamsData?.totalPlayers}
            />

            {/*/!* Tab Content *!/*/}
            {activeTab === 'my-team' && (
                <MyTeamView viewMode={viewMode} data={data} />
            )}
            {activeTab === 'all-teams' && (
                <AllTeamsView
                    teamsByCode={data.teamsByCode}
                    fplPlayersByCode={data.fplPlayersByCode}
                    allTeamsData={data.allTeamsData}
                    currentUser={data.currentUser}
                    selectedGameweek={data.selectedGameweekData.fplEvent.id}
                    division={data.division}
                    gameweek={selectedGameweek}
                    isCurrentGameweek={isCurrentGameweek}
                    viewMode={viewMode}
                />
            )}
            {activeTab === 'totw' && data.teamOfTheWeek && (
                <TeamOfTheWeek data={data.teamOfTheWeek} />
            )}
        </>
    );
};
