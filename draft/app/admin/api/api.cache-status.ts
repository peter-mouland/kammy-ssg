/* Location: app/admin/api/api.cache-status.ts */

// /admin/api/api.cache-status.ts
import { data, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { handleGetCacheStatus } = await import('../server/actions/system-actions');
        const result = await handleGetCacheStatus();

        return data(result);
    } catch (error) {
        console.error('Cache status API error:', error);
        return data(
            {
                success: false,
                error: 'Failed to get cache status',
            },
            { status: 500 },
        );
    }
}
