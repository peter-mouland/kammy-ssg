// app/routes/api.admin.clear-firestore.ts
import { type ActionFunctionArgs } from "react-router";
import { FirestoreClearService } from "./server/firestore-cache/clear-service";

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    // Basic auth check (add your own auth logic)
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || !isValidAuth(authHeader)) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        const { variant } = await request.json();

        if (!['all', 'fpl-only', 'elements-only'].includes(variant)) {
            return new Response('Invalid variant', { status: 400 });
        }

        const clearService = new FirestoreClearService();

        // Create a streaming response for progress updates
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();

                const progressCallback = (progress: any) => {
                    const message = `data: ${JSON.stringify(progress)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                };

                // Start the clearing process
                const clearPromise = async () => {
                    try {
                        switch (variant) {
                            case 'all':
                                await clearService.clearAllData(progressCallback);
                                break;
                            case 'fpl-only':
                                await clearService.clearFplCacheOnly(progressCallback);
                                break;
                            case 'elements-only':
                                await clearService.clearElementSummariesOnly(progressCallback);
                                break;
                        }

                        // Send final success message
                        progressCallback({
                            stage: 'Clear completed successfully',
                            progress: 1,
                            total: 1,
                            completed: true
                        });

                    } catch (error) {
                        progressCallback({
                            stage: 'Clear failed',
                            progress: 0,
                            total: 1,
                            completed: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    } finally {
                        controller.close();
                    }
                };

                clearPromise();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error('Clear firestore error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Simple auth check - replace with your auth logic
function isValidAuth(authHeader: string): boolean {
    // For now, just check for a basic admin token
    // In production, implement proper authentication
    const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
    return authHeader === `Bearer ${adminToken}`;
}
