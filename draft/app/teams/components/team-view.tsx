// app/teams/components/team-view.tsx
import { useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { TimeTravelBanner } from '../../_shared/components/time-travel-banner';
import type { StatsViewMode, TeamViewData } from '../types/team-types';
import type { TeamViewTab } from '../types/team-view-types';
import { GameweekSelector } from './gameweek-selector';
import styles from './team-view.module.css';
import { AllTeamsView } from './team-view-all-teams';
import { MyTeamView } from './team-view-my-team';
import { TeamViewTabs } from './team-view-tabs';

export const TeamView = () => {
    const data = useLoaderData<TeamViewData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedGameweek = data.selectedGameweekData.fplEvent.id;

    // Get active tab from URL or default to 'my-team'
    const activeTab = (searchParams.get('tab') as TeamViewTab) || 'my-team';

    // Global view mode state - controls both pitch and stats
    const [viewMode, setViewMode] = useState<StatsViewMode>('gameweek');

    const handleTabChange = (tab: TeamViewTab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', tab);
        setSearchParams(newParams);
    };

    const handleViewModeChange = (newMode: StatsViewMode) => {
        setViewMode(newMode);
    };

    const isCurrentGameweek = selectedGameweek === data.currentGameweek;

    return (
        <div className={styles.teamViewContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.teamInfo}>
                    <h1 className={styles.teamName}>{data.currentUser.userName}</h1>
                    <div className={styles.divisionBadge}>{data.division.label}</div>
                </div>

                <div className={styles.headerControls}>
                    <GameweekSelector
                        currentGameweekData={data.currentGameweekData}
                        selectedGameweekData={data.selectedGameweekData}
                        availableGameweeks={data.availableGameweeks}
                    />
                </div>
            </div>

            {/* Time Travel Indicator */}
            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}

            {/* Tab Navigation */}
            <TeamViewTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
                playerCount={data.allTeamsData?.totalPlayers}
            />

            {/* Tab Content */}
            {activeTab === 'my-team' ? (
                <MyTeamView viewMode={viewMode} handleViewModeChange={handleViewModeChange} data={data} />
            ) : (
                <AllTeamsView
                    teamsByCode={data.teamsByCode}
                    fplPlayersByCode={data.fplPlayersByCode}
                    allTeamsData={data.allTeamsData}
                    currentUser={data.currentUser}
                    division={data.division}
                    gameweek={selectedGameweek}
                    isCurrentGameweek={isCurrentGameweek}
                    viewMode={viewMode}
                />
            )}
        </div>
    );
};
