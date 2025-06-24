// app/_shared/services/division-teams-integration.service.ts

import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import type { DivisionId } from '../../../teams/types/team-types';
import { divisionDocumentExists } from './division-teams.service';

/**
 * Ensure all divisions have the required gameweek documents
 * Uses the existing team commit logic for proper document creation
 */
export async function ensureDivisionGameweekDocuments(targetGameweeks: number[]): Promise<{
    divisionsProcessed: number;
    documentsCreated: number;
    errors: string[];
}> {
    console.log(`🔄 Ensuring division documents exist for gameweeks: ${targetGameweeks.join(', ')}`);

    const results = {
        divisionsProcessed: 0,
        documentsCreated: 0,
        errors: [] as string[],
    };

    try {
        // Get all divisions
        const divisions = await readDivisions();

        for (const division of divisions) {
            try {
                results.divisionsProcessed++;

                for (const gameweek of targetGameweeks) {
                    const documentCreated = await ensureSingleDivisionGameweekDocument(division.id, gameweek);

                    if (documentCreated) {
                        results.documentsCreated++;
                    }
                }
            } catch (error) {
                const errorMsg = `Failed to process division ${division.id}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`;
                console.error(`❌ ${errorMsg}`);
                results.errors.push(errorMsg);
            }
        }

        console.log(
            `✅ Division document check complete: ${results.documentsCreated} documents created for ${results.divisionsProcessed} divisions`,
        );
    } catch (error) {
        const errorMsg = `Failed to ensure division gameweek documents: ${
            error instanceof Error ? error.message : 'Unknown error'
        }`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
    }

    return results;
}

/**
 * Ensure a specific division has a document for a specific gameweek
 */
async function ensureSingleDivisionGameweekDocument(divisionId: DivisionId, targetGameweek: number): Promise<boolean> {
    try {
        // Check if document already exists
        const exists = await divisionDocumentExists(divisionId, targetGameweek);
        if (exists) {
            console.log(`✓ Document already exists: ${divisionId}_gw${targetGameweek}`);
            return false; // Document wasn't created
        }

        console.log(`🔄 Creating missing document: ${divisionId}_gw${targetGameweek}`);

        if (targetGameweek === 1) {
            // For draft (GW 1), use the existing commit teams logic
            return await createDraftDocument(divisionId);
        } else {
            // For other gameweeks, copy from previous gameweek
            return await createNextGameweekDocument(divisionId, targetGameweek);
        }
    } catch (error) {
        console.error(`❌ Failed to ensure document for ${divisionId} GW${targetGameweek}:`, error);
        throw error;
    }
}

/**
 * Create draft document using existing commit teams logic
 */
async function createDraftDocument(divisionId: DivisionId): Promise<boolean> {
    try {
        console.log(`🔄 Creating draft document for division: ${divisionId}`);

        // Use the existing team commit logic
        const { handleCommitTeamsToFirestore } = await import('../../../admin/server/actions/team-commit-actions');

        const result = await handleCommitTeamsToFirestore({
            actionType: 'ensureDivisionDocument',
            divisionId,
        });

        if (result.success) {
            console.log(`✅ Created draft document: ${divisionId}_gw0`);
            return true;
        } else {
            throw new Error(`Failed to create draft document: ${result.message}`);
        }
    } catch (error) {
        console.error(`❌ Failed to create draft document for ${divisionId}:`, error);
        // Don't throw - this might be expected if no draft data exists
        return false;
    }
}

/**
 * Create next gameweek document by copying from previous gameweek
 */
async function createNextGameweekDocument(divisionId: DivisionId, targetGameweek: number): Promise<boolean> {
    try {
        console.log(`🔄 Creating GW${targetGameweek} document for division: ${divisionId}`);

        // Use the existing createNextGameweekDocument function from team commit actions
        const { createNextGameweekDocument } = await import('../../../admin/server/actions/team-commit-actions');

        const result = await createNextGameweekDocument({
            divisionId,
            currentGameweek: targetGameweek - 1, // Copy from previous gameweek
        });

        if (result.success) {
            console.log(`✅ Created gameweek document: ${divisionId}_gw${targetGameweek}`);
            return true;
        } else {
            throw new Error(`Failed to create gameweek document: ${result.message}`);
        }
    } catch (error) {
        console.error(`❌ Failed to create GW${targetGameweek} document for ${divisionId}:`, error);
        // Don't throw - this might be expected if no source document exists
        return false;
    }
}
