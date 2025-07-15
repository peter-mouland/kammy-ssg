// app/routes/api.admin.draft-sync-comparisons.ts
// API route to serve draft sync comparison data

import type { LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Dynamic import to prevent server code in client bundle
        const { getAllDraftSyncComparisons } = await import('../server/services/draft-sync-comparison.service');

        const comparisons = await getAllDraftSyncComparisons();

        return data(comparisons);
    } catch (error) {
        console.error('❌ Failed to get draft sync comparisons:', error);

        return data(
            {
                error: 'Failed to load draft sync comparisons',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
