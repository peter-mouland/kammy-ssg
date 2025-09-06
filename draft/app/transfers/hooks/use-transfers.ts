/* Location: app/transfers/hooks/use-transfers.ts */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DivisionId } from '../../teams/types/team-types';
import type { ProcessedTransferSheetData } from '../types/transfer-types';

interface UseTransfersOptions {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
}

interface TransfersResponse {
    transfers: ProcessedTransferSheetData[];
    divisionId: DivisionId;
    lastUpdated: string;
}

/**
 * Hook to fetch fresh transfers data using TanStack Query
 * Bypasses server-side caching to ensure data is always fresh on the client
 */
export function useTransfers(divisionId: DivisionId | undefined, options: UseTransfersOptions = {}) {
    const {
        enabled = true,
        staleTime = 0, // Always fetch fresh data
        refetchInterval = 30000, // Refetch every 30 seconds
    } = options;

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['transfers', divisionId],
        queryFn: async (): Promise<TransfersResponse> => {
            if (!divisionId) {
                throw new Error('Division ID is required');
            }

            const response = await fetch(`/api/transfers/${divisionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add cache-busting header to ensure fresh data
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch transfers: ${response.statusText}`);
            }

            return response.json();
        },
        enabled: enabled && !!divisionId,
        staleTime,
        refetchInterval,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });

    const invalidateTransfers = () => {
        queryClient.invalidateQueries({ queryKey: ['transfers', divisionId] });
    };

    const refetchTransfers = () => {
        return query.refetch();
    };

    return {
        transfers: query.data?.transfers ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isRefetching: query.isRefetching,
        lastUpdated: query.data?.lastUpdated,
        divisionId: query.data?.divisionId,
        invalidateTransfers,
        refetchTransfers,
    };
}
