// app/_shared/services/division-teams-integration.service.ts
import { divisionDocumentExists } from '../../../_shared/services/division-teams.service';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';

/**
 * Ensure all divisions have the required gameweek documents
 * Uses the existing team commit logic for proper document creation
 */
export async function ensureDivisionGameweekDocuments(
    targetGameweeks: number[],
    currentGameweek: number
): Promise<{
    divisionsProcessed: number;
    documentsCreated: number;
    errors: string[];
}> {
    console.log(`🔄 Ensuring division documents exist for gameweeks: ${targetGameweeks.join(', ')}`);

    const results = {
        divisionsProcessed: 0,
        documentsCreated: 0,
        errors: [] as string[]
    };

    try {
        // Get all divisions
        const divisions = await readDivisions();

        for (const division of divisions) {
            try {
                results.divisionsProcessed++;

                for (const gameweek of targetGameweeks) {
                    const documentCreated = await ensureSingleDivisionGameweekDocument(
                        division.id,
                        gameweek,
                        currentGameweek
                    );

                    if (documentCreated) {
                        results.documentsCreated++;
                    }
                }

            } catch (error) {
                const errorMsg = `Failed to process division ${division.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`❌ ${errorMsg}`);
                results.errors.push(errorMsg);
            }
        }

        console.log(`✅ Division document check complete: ${results.documentsCreated} documents created for ${results.divisionsProcessed} divisions`);

    } catch (error) {
        const errorMsg = `Failed to ensure division gameweek documents: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
    }

    return results;
}

/**
 * Ensure a specific division has a document for a specific gameweek
 */
async function ensureSingleDivisionGameweekDocument(
    divisionId: string,
    targetGameweek: number,
    currentGameweek: number
): Promise<boolean> {
    try {
        // Check if document already exists
        const exists = await divisionDocumentExists(divisionId, targetGameweek);
        if (exists) {
            console.log(`✓ Document already exists: ${divisionId}_gw${targetGameweek}`);
            return false; // Document wasn't created
        }

        console.log(`🔄 Creating missing document: ${divisionId}_gw${targetGameweek}`);

        if (targetGameweek === 0) {
            // For draft (GW 0), use the existing commit teams logic
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
async function createDraftDocument(divisionId: string): Promise<boolean> {
    try {
        console.log(`🔄 Creating draft document for division: ${divisionId}`);

        // Use the existing team commit logic
        const { handleCommitTeamsToFirestore } = await import('../../../admin/server/actions/team-commit-actions');

        const result = await handleCommitTeamsToFirestore({
            actionType: 'ensureDivisionDocument',
            divisionId
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
async function createNextGameweekDocument(
    divisionId: string,
    targetGameweek: number
): Promise<boolean> {
    try {
        console.log(`🔄 Creating GW${targetGameweek} document for division: ${divisionId}`);

        // Use the existing createNextGameweekDocument function from team commit actions
        const { createNextGameweekDocument } = await import('../../../admin/server/actions/team-commit-actions');

        const result = await createNextGameweekDocument({
            divisionId,
            currentGameweek: targetGameweek - 1 // Copy from previous gameweek
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

/**
 * Get divisions that have been set up (have at least draft document)
 */
export async function getDivisionsWithTeamData(): Promise<string[]> {
    try {
        const divisions = await readDivisions();
        const setupDivisions: string[] = [];

        for (const division of divisions) {
            const hasDraftDoc = await divisionDocumentExists(division.id, 0);
            if (hasDraftDoc) {
                setupDivisions.push(division.id);
            }
        }

        return setupDivisions;
    } catch (error) {
        console.error('Error getting divisions with team data:', error);
        return [];
    }
}
