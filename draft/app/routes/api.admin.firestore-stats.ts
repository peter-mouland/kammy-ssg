// app/routes/api.admin.firestore-stats.ts
import { type LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { FirestoreClearService } from "./server/firestore-cache/clear-service";

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    // Basic auth check
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token || !isValidAuth(`Bearer ${token}`)) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const clearService = new FirestoreClearService();

        const [stats, estimate] = await Promise.all([
            clearService.getCollectionStats(),
            clearService.estimateClearTime()
        ]);

        return data({
            stats,
            estimate,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get firestore stats error:', error);
        return data(
            {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Simple auth check - replace with your auth logic
function isValidAuth(authHeader: string): boolean {
    const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
    return authHeader === `Bearer ${adminToken}`;
}
