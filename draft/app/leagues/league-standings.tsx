/* Location: app/leagues/league-standings.tsx */

import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { GameweekSelector } from '../_shared/components/gameweek-selector';
import { PageHeader } from '../_shared/components/page-header';
import { SelectDivision } from '../_shared/components/select-division';
import { TimeTravelBanner } from '../_shared/components/time-travel-banner';
import { UserSelectionProvider } from '../_shared/features/user-selection/user-selection-provider';
import type { DivisionId, DivisionSheetData } from '../_shared/types/league-types';
import { PositionPointsTable } from './components/position-points-table';
import { RangeGameweeks } from './components/range-gameweeks';
import styles from './league-standings.module.css';
import { formatGameweekRange, type GameweekRange, RANGE_PARAMS } from './lib/gameweek-range';
import type { EnhancedLeagueStandingsLoaderData } from './types/league-standings-types';

function DivisionStandingsTable({
    division,
    teams,
    selectedGameweek,
    selectedRange,
}: {
    division: DivisionSheetData;
    teams: EnhancedLeagueStandingsLoaderData['standingsData'][DivisionId];
    selectedGameweek: number;
    selectedRange: GameweekRange | null;
}) {
    const isFirstGameweek = selectedGameweek === 0;

    if (teams.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">📊 {division.label} Division</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No Teams in Division</h3>
                    <p style={{ margin: 0 }}>No teams have been added to the {division.label} division yet.</p>
                </div>
            </div>
        );
    }

    if (selectedRange) {
        const rangeLabel = formatGameweekRange(selectedRange);
        // No rank changes and no promotion/relegation markers: both describe the season.
        return (
            <PositionPointsTable
                teams={teams}
                pointsSource="gameweekPoints"
                title={`📅 ${rangeLabel}`}
                subtitle={`Points scored during ${rangeLabel.toLowerCase()}`}
                showRankChange={false}
                selectedGameweek={selectedGameweek}
            />
        );
    }

    return (
        <>
            <PositionPointsTable
                teams={teams}
                pointsSource="seasonPoints"
                title="🏆 Season Standings"
                subtitle={`Total points accumulated until gameweek ${selectedGameweek}`}
                showRankChange={false}
                selectedGameweek={selectedGameweek}
                division={division}
            />

            <PositionPointsTable
                teams={teams}
                pointsSource="gameweekPoints"
                title={`⚡ Gameweek ${selectedGameweek}`}
                subtitle={`Points scored during gameweek ${selectedGameweek}${isFirstGameweek ? '' : ' with position rank changes'}`}
                showRankChange={true}
                isFirstGameweek={isFirstGameweek}
                selectedGameweek={selectedGameweek}
            />
        </>
    );
}

export const LeagueStandings = () => {
    const data = useLoaderData<EnhancedLeagueStandingsLoaderData>();

    return (
        <UserSelectionProvider
            users={data.userTeams}
            onUserSelected={console.log}
            redirectOnSelection={false}
            fallbackContent={
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>Welcome to Fantasy Football!</h2>
                    <p>Please select your profile to continue</p>
                </div>
            }
            initialSelection={data.persistedUser}
        >
            <LeagueStandingsComp {...data} />
        </UserSelectionProvider>
    );
};

const LeagueStandingsComp = ({
    divisions,
    selectedDivision,
    selectedGameweek,
    currentGameweek,
    selectedGameweekData,
    currentGameweekData,
    availableGameweeks,
    standingsData,
    selectedRange = null,
    rangeGameweeks = [],
}: EnhancedLeagueStandingsLoaderData) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isCurrentGameweek = !searchParams.get('gameweek') || searchParams.get('gameweek') === String(currentGameweek);

    const handleDivisionChange = (divisionId: string) => {
        // A range carries across divisions, so one link compares a month in each.
        const query = selectedRange
            ? `?from=${selectedRange.from}&to=${selectedRange.to}`
            : `?gameweek=${selectedGameweek}`;
        if (divisionId !== 'all') {
            navigate(`/leagues/${divisionId}${query}`);
        } else {
            navigate(`/leagues${query}`);
        }
    };

    return (
        <>
            <PageHeader
                title={`${selectedDivision?.label} Standings`}
                actions={
                    <div className={styles.headerControls}>
                        <div className={styles.gameweekControl}>
                            <GameweekSelector
                                currentGameweekData={currentGameweekData}
                                selectedGameweekData={selectedGameweekData}
                                availableGameweeks={availableGameweeks}
                                showRangeOption
                                selectedRange={selectedRange}
                            />
                        </div>
                        <SelectDivision
                            divisions={divisions}
                            selectedDivision={selectedDivision?.id}
                            handleDivisionChange={handleDivisionChange}
                        />
                    </div>
                }
            />

            {selectedRange ? (
                <TimeTravelBanner
                    currentGameweek={currentGameweek}
                    message="Viewing a range of gameweeks"
                    clearParams={[...RANGE_PARAMS]}
                />
            ) : (
                !isCurrentGameweek && <TimeTravelBanner currentGameweek={currentGameweek} />
            )}

            {selectedDivision ? (
                <DivisionStandingsTable
                    division={selectedDivision}
                    teams={standingsData[selectedDivision?.id] || []}
                    selectedGameweek={selectedGameweek}
                    selectedRange={selectedRange}
                />
            ) : (
                <div>
                    {divisions.length === 0 ? (
                        <div className="card">
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Divisions Found</h3>
                                <p style={{ margin: 0 }}>
                                    No divisions have been created yet. Create divisions to organize your league
                                    standings.
                                </p>
                            </div>
                        </div>
                    ) : (
                        divisions
                            .sort((a, b) => a.order - b.order)
                            .map((division) => (
                                <DivisionStandingsTable
                                    key={division.id}
                                    division={division}
                                    teams={standingsData[division.id] || []}
                                    selectedGameweek={selectedGameweek}
                                    selectedRange={selectedRange}
                                />
                            ))
                    )}
                </div>
            )}

            {/* Once, after every division's table: it is about the range, not a division. */}
            {selectedRange && rangeGameweeks.length > 0 && <RangeGameweeks windows={rangeGameweeks} />}
        </>
    );
};
