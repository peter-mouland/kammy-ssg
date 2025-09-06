/* Location: app/_shared/lib/query-client.ts */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure TanStack Query client
 * with appropriate defaults for the fantasy football app
 */
export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is fresh for 0ms (always stale, always refetch)
                staleTime: 0,
                // Keep data in cache for 5 minutes
                gcTime: 1000 * 60 * 5,
                // Retry failed requests 3 times
                retry: 3,
                // Retry delay increases exponentially
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                // Refetch on window focus for real-time updates
                refetchOnWindowFocus: true,
                // Refetch when component mounts
                refetchOnMount: true,
                // Don't refetch on reconnect by default
                refetchOnReconnect: false,
            },
            mutations: {
                // Retry mutations once
                retry: 1,
                // Don't retry on 4xx errors (client errors)
                retryDelay: 1000,
            },
        },
    });
}

// Export a singleton instance for use throughout the app
export const queryClient = createQueryClient();
