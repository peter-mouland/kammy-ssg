// app/admin/libs/admin-progress.route.tsx
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request, params }: LoaderFunctionArgs) {
    const jobId = params.jobId;

    if (!jobId) {
        return new Response('Missing jobId parameter', { status: 400 });
    }

    console.log('🔍 Dedicated SSE route handling jobId:', jobId);
    const { createProgressStream } = await import('./libs/admin-progress.server');

    // Simply pass the jobId directly
    return createProgressStream(request, jobId);
}
