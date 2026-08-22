// app/admin/libs/background-jobs.server.ts

import type { DivisionSheetData } from '../../_shared/types/league-types';
import {
    calculateSingleTeamPoints,
    getDivisionTeamsDocument,
    updateDivisionTeamsDocument,
    upsertDivisionTeamsDocument,
} from '../../scoring/index.server';
import type { DivisionTeamsDocument } from '../../teams';
import { progressStore } from './progress-store.server';

interface DivisionInfo {
    division: DivisionSheetData;
    teamCount: number;
}

export async function regeneratePoints(
    jobId: string,
    jobType: 'all' | 'gameweek' | 'gameweeks',
    orchestrator: any,
    gameweekId: number,
): Promise<void> {
    console.log('🔍 regeneratePoints called with:', { jobId, gameweekId });
    const options = { forceFullRegeneration: jobType === 'all' };

    try {
        progressStore.updateProgress(jobId, {
            stage: 'starting',
            percentage: 0,
            message: 'Loading gameweeks and divisions...',
            status: 'running',
        });

        const availableGameweeks =
            jobType === 'gameweeks'
                ? await createGameweekIds(gameweekId)
                : gameweekId
                  ? [gameweekId]
                  : await getAllGameweekIds();
        const allGameweeks = availableGameweeks;
        const totalGameweeks = allGameweeks.length;

        // Pre-calculate total operations for accurate progress
        const divisions = await loadDivisionsData();
        const divisionInfos = await getDivisionInfos(divisions, allGameweeks[0]);
        const totalTeams = divisionInfos.reduce((sum, info) => sum + info.teamCount, 0);
        const totalOperations = totalGameweeks * totalTeams;
        let completedOperations = 0;

        progressStore.updateProgress(jobId, {
            stage: 'gameweek',
            percentage: 0,
            message: `Found ${totalGameweeks} gameweeks, ${divisions.length} divisions, ${totalTeams} teams to process`,
            details: {
                totalGameweeks,
                totalDivisions: divisions.length,
                totalTeams,
                totalOperations,
                currentTeam: '-',
            },
        });

        for (let i = 0; i < allGameweeks.length; i++) {
            const gameweekId = allGameweeks[i];

            completedOperations = await processGameweekWithProgress(
                jobId,
                orchestrator,
                gameweekId,
                divisionInfos,
                completedOperations,
                totalOperations,
                options,
            );
        }

        progressStore.updateProgress(jobId, {
            stage: 'completed',
            percentage: 100,
            message: `Successfully regenerated points for all ${totalGameweeks} gameweeks`,
            status: 'completed',
        });
    } catch (error) {
        progressStore.updateProgress(jobId, {
            stage: 'error',
            percentage: 0,
            message: `Error regenerating all points: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw Error(`Error in regenerating all points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function processGameweekWithProgress(
    jobId: string,
    _orchestrator: any,
    gameweekId: number,
    divisionInfos: DivisionInfo[],
    startingCompletedOperations: number,
    totalOperations: number,
    options: any,
): Promise<number> {
    try {
        let completedOperations = startingCompletedOperations;

        for (let i = 0; i < divisionInfos.length; i++) {
            const { division } = divisionInfos[i];

            progressStore.updateProgress(jobId, {
                stage: 'division',
                percentage: Math.floor((completedOperations / totalOperations) * 100),
                message: `Gameweek ${gameweekId}: Processing division ${division.id}`,
                details: {
                    currentGameweek: gameweekId,
                    currentDivision: division.id,
                    completedOperations,
                    totalOperations,
                    currentTeam: '-',
                },
            });

            const divisionDoc = await upsertDivisionTeamsDocument(division.id, gameweekId, options);

            if (!divisionDoc) {
                console.error('no divisionDoc', division.id, gameweekId, options);
                // continue;
            }

            completedOperations = await processDivisionWithProgress(
                jobId,
                gameweekId,
                divisionDoc,
                completedOperations,
                totalOperations,
            );

            await updateDivisionTeamsDocument(division.id, gameweekId, {
                teams: divisionDoc?.teams,
                'metadata.updatedAt': new Date().toISOString(),
                'metadata.pointsLastUpdated': new Date().toISOString(),
                'metadata.pointsLastGameweek': gameweekId,
            });
        }

        return completedOperations;
    } catch (error) {
        progressStore.updateProgress(jobId, {
            stage: 'error',
            percentage: 0,
            message: `Error in processGameweekWithProgress: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw Error(
            `Error in processGameweekWithProgress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

async function processDivisionWithProgress(
    jobId: string,
    gameweekId: number,
    divisionDoc: DivisionTeamsDocument,
    startingCompletedOperations: number,
    totalOperations: number,
): Promise<number> {
    try {
        const previousDivisionDoc = await getDivisionTeamsDocument(divisionDoc.divisionId, gameweekId - 1);
        const RosterByManagerId = divisionDoc.teams || [];
        const managers = Object.keys(RosterByManagerId);
        const totalTeams = managers.length;
        let completedOperations = startingCompletedOperations;

        for (let i = 0; i < managers.length; i++) {
            const manager = managers[i];
            const teamData = RosterByManagerId[manager];

            progressStore.updateProgress(jobId, {
                stage: 'team',
                percentage: Math.floor((completedOperations / totalOperations) * 100),
                message: `Processing team: ${manager}`,
                details: {
                    currentGameweek: gameweekId,
                    currentDivision: divisionDoc.divisionId,
                    currentTeam: manager,
                    teamProgress: `${i + 1}/${totalTeams}`,
                    completedOperations,
                    totalOperations,
                },
            });

            await calculateSingleTeamPoints({
                divisionId: divisionDoc.divisionId,
                gameweek: gameweekId,
                userId: manager,
                teamData,
                divisionDoc,
                previousDivisionDoc,
            });

            completedOperations++;
        }

        return completedOperations;
    } catch (error) {
        progressStore.updateProgress(jobId, {
            stage: 'error',
            percentage: 0,
            message: `Error processDivisionWithProgress: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw Error(
            `Error in processDivisionWithProgress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

async function getDivisionInfos(divisions: DivisionSheetData[], sampleGameweek: number): Promise<DivisionInfo[]> {
    const infos: DivisionInfo[] = [];

    for (const division of divisions) {
        try {
            // Get a sample document to count teams
            const doc = await upsertDivisionTeamsDocument(division.id, sampleGameweek, { skipProcessing: true });
            const teamCount = Object.keys(doc.teams || {}).length;
            infos.push({ division, teamCount });
        } catch (error) {
            console.warn(`Could not get team count for division ${division.id}, using default`, error);
            infos.push({ division, teamCount: 10 }); // fallback estimate
        }
    }

    return infos;
}

async function getCurrentGameweekId(): Promise<number> {
    const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
    return await fplApiCache.getScoringGameweek();
}

async function getAllGameweekIds(): Promise<number[]> {
    const currentId = await getCurrentGameweekId();
    return Array.from({ length: currentId }, (_, i) => i + 1);
}

async function createGameweekIds(gameweekId: number): Promise<number[]> {
    const currentId = await getCurrentGameweekId();
    return Array.from({ length: currentId - gameweekId + 1 }, (_, i) => gameweekId + i);
}

async function loadDivisionsData(): Promise<DivisionSheetData[]> {
    try {
        const { readDivisions } = await import('../../_shared/lib/sheets/divisions');
        const divisions = await readDivisions();

        return divisions || [];
    } catch (error) {
        console.error('Error loading divisions data:', error);
        return [];
    }
}
