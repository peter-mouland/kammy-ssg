// app/lib/server/cache/refresh.ts - REPLACE YOUR EXISTING FILE

import type { RefreshOptions, CacheOperationStatus } from './types';
import {
    getCacheOperationStatus,
    setCacheOperationStatus,
    clearCacheOperationStatus,
    isCacheOperationRunning
} from './operations';
import { generateFreshPlayerData } from './data-generator';
import { cleanupOldGameweeks } from './gameweek-storage';
import { getCurrentGameweek } from '../fpl/api';

export async function refreshPlayerCache(options: RefreshOptions = {}): Promise<{ success: boolean; message: string; playersCount: number }> {
    // Check if cache operation is already running
    const isRunning = await isCacheOperationRunning();
    if (isRunning) {
        throw new Error('Cache refresh already in progress. Please wait for current operation to complete.');
    }

    let operationType: CacheOperationStatus['operationType'];
    if (options.clearAll) {
        operationType = 'clear_rebuild';
    } else if (options.forceFullRefresh) {
        operationType = 'full_refresh';
    } else {
        operationType = 'quick_refresh';
    }

    const startTime = new Date();

    // Set operation status to running
    await setCacheOperationStatus({
        operationType,
        status: 'running',
        startedAt: startTime,
        progress: {
            currentStep: 'Starting cache refresh...'
        }
    });

    try {

        const { players } = await generateFreshPlayerData(options);

        // Update progress
        await setCacheOperationStatus({
            operationType,
            status: 'running',
            startedAt: startTime,
            progress: {
                currentStep: 'Finalizing cache update...',
                playersProcessed: players.length,
                totalPlayers: players.length
            }
        });

        let message: string;
        if (options.clearAll) {
            message = 'Cache cleared and rebuilt with new structure';
        } else if (options.forceFullRefresh) {
            message = 'Full cache refresh completed (all gameweeks)';
        } else if (options.quickRefresh) {
            message = 'Quick refresh completed (current gameweek only)';
        } else {
            message = 'Incremental cache update completed';
        }

        // Mark operation as completed
        await setCacheOperationStatus({
            operationType,
            status: 'completed',
            startedAt: startTime,
            completedAt: new Date(),
            progress: {
                currentStep: 'Cache refresh completed',
                playersProcessed: players.length,
                totalPlayers: players.length
            }
        });

        // Clear operation status
        console.log('Cache refresh completed, clearing operation status...');
        await clearCacheOperationStatus();

        return {
            success: true,
            message,
            playersCount: players.length
        };
    } catch (error) {
        console.error('Error refreshing player cache:', error);

        // Mark operation as failed
        await setCacheOperationStatus({
            operationType,
            status: 'failed',
            startedAt: startTime,
            completedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
            progress: {
                currentStep: 'Cache refresh failed'
            }
        });

        console.log('Cache refresh failed, clearing operation status...');
        await clearCacheOperationStatus();

        throw error;
    }
}

// New function to manually clear stuck operations
export async function clearStuckOperations(): Promise<{ cleared: boolean; wasStuck: boolean }> {
    try {
        const status = await getCacheOperationStatus();

        if (!status) {
            return { cleared: false, wasStuck: false };
        }

        // Consider operation stuck if it's been running for more than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const isStuck = status.status === 'running' && status.startedAt < tenMinutesAgo;

        if (isStuck) {
            console.log(`Clearing stuck operation: ${status.operationType} running since ${status.startedAt}`);
            await clearCacheOperationStatus();
            return { cleared: true, wasStuck: true };
        }

        return { cleared: false, wasStuck: false };
    } catch (error) {
        console.error('Error clearing stuck operations:', error);
        return { cleared: false, wasStuck: false };
    }
}
