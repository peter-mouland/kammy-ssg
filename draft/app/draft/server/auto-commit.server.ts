/* Location: app/draft/server/auto-commit.server.ts */

import type { AdminActionResult } from '../../admin/types/admin-types';
import type { DivisionId } from '../../teams/types/team-types';

/**
 * Auto-commit teams to Firestore when draft completes
 *
 * This function wraps the admin team commit functionality
 * to maintain domain boundaries while enabling automatic
 * team commitment on draft completion.
 */
export async function autoCommitTeamsToFirestore(divisionId: DivisionId): Promise<AdminActionResult> {
    try {
        console.log(`🔄 Auto-committing teams for completed draft: ${divisionId}`);

        // Dynamically import admin team commit function to prevent
        // admin domain code from appearing in client bundles
        const { handleCommitTeamsToFirestore } = await import('../../admin/server/actions/team-commit-actions');

        const result = await handleCommitTeamsToFirestore({
            actionType: 'autoCommitTeamsToFirestore',
            divisionId,
        });

        if (result.success) {
            console.log(`✅ Auto-commit successful: ${result.message}`);
            return {
                success: true,
                message: result.message,
            };
        } else {
            const errorMsg = `Auto-commit failed: ${result.message}`;
            console.error(`❌ ${errorMsg}`);
            return {
                success: false,
                message: errorMsg,
                error: result.message,
            };
        }
    } catch (error) {
        const errorMsg = `Auto-commit teams failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌ Auto-commit error:', error);

        return {
            success: false,
            message: errorMsg,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
