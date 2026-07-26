/* Location: app/api/transfers/api.transfers.ts */

import type { LoaderFunctionArgs } from 'react-router';
import type { DivisionId } from '../../_shared/types/league-types';

interface TransfersApiResponse {
    transfers: any[];
    divisionId: DivisionId;
    lastUpdated: string;
    success: boolean;
    error?: string;
}

export async function loader({ params }: LoaderFunctionArgs) {
    try {
        const divisionId = params.divisionId as DivisionId;

        if (!divisionId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Division ID is required',
                    transfers: [],
                    divisionId: '',
                    lastUpdated: new Date().toISOString(),
                } as TransfersApiResponse),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        // Prevent caching to ensure fresh data
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );
        }

        console.log(`📡 API: Fetching fresh transfers data for division: ${divisionId}`);

        // Dynamic import to keep server code on server
        const { readTransfers } = await import('../../_shared/lib/sheets/transfers');

        // Call readTransfers directly to bypass cache
        const transfers = await readTransfers(divisionId);

        const response: TransfersApiResponse = {
            success: true,
            transfers,
            divisionId,
            lastUpdated: new Date().toISOString(),
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                // Prevent caching to ensure fresh data
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
            },
        });
    } catch (error) {
        console.error('❌ Transfers API error:', error);

        const errorResponse: TransfersApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch transfers',
            transfers: [],
            divisionId: (params.divisionId as DivisionId) || '',
            lastUpdated: new Date().toISOString(),
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    }
}
