// app/admin/libs/admin-progress.server.ts

import { type ProgressSubscriber, progressStore } from './progress-store.server';

export function createProgressStream(request: Request, jobIdIn?: string): Response {
    const jobId = jobIdIn || new URL(request.url).searchParams.get('jobId');

    if (!jobId) {
        return new Response('Missing jobId parameter', { status: 400 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const subscriber: ProgressSubscriber = {
                response: new Response(),
                controller,
            };

            progressStore.subscribe(jobId, subscriber);

            const connectionData = `data: ${JSON.stringify({
                type: 'connection',
                jobId,
                message: 'Connected to progress stream',
                timestamp: Date.now(),
            })}\n\n`;

            controller.enqueue(new TextEncoder().encode(connectionData));

            request.signal.addEventListener('abort', () => {
                progressStore.unsubscribe(jobId, subscriber);
                try {
                    controller.close();
                } catch (_error) {
                    console.log('Controller already closed');
                }
            });
        },

        cancel() {
            console.log(`Progress stream cancelled for job: ${jobId}`);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        },
    });
}

export function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
