// app/admin/admin-progress-poll.route.tsx
import type { LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { progressStore } from './libs/progress-store.server';

export async function loader({ params }: LoaderFunctionArgs) {
    const { jobId } = params;

    if (!jobId) {
        return data({ error: 'Job ID is required' }, { status: 400 });
    }

    const progress = progressStore.getProgress(jobId);

    if (!progress) {
        return data(
            {
                error: 'Job not found or expired',
                jobId,
            },
            { status: 404 },
        );
    }

    return data(progress, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        },
    });
}
