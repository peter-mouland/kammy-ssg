// hooks/use-optimistic-picks.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useActionData } from 'react-router';
import type { DraftPickData } from '../types';

interface OptimisticPick extends DraftPickData {
    isOptimistic?: boolean;
    timestamp?: number;
}

export function useOptimisticPicks(initialPicks: DraftPickData[]) {
    const [optimisticPicks, setOptimisticPicks] = useState<OptimisticPick[]>([]);
    const lastActionDataRef = useRef<any>();
    const actionData = useActionData();

    // Clear optimistic picks when real data comes back
    useEffect(() => {
        if (actionData !== lastActionDataRef.current) {
            lastActionDataRef.current = actionData;

            if (actionData?.success) {
                setOptimisticPicks([]);
            } else if (actionData?.error) {
                setTimeout(() => {
                    setOptimisticPicks(prev => prev.filter(pick =>
                        !pick.isOptimistic ||
                        (pick.timestamp && Date.now() - pick.timestamp < 5000)
                    ));
                }, 1000);
            }
        }
    }, [actionData]);

    // Clean up old optimistic picks (less frequent)
    useEffect(() => {
        const cleanup = setInterval(() => {
            setOptimisticPicks(prev => {
                const filtered = prev.filter(pick =>
                    !pick.isOptimistic ||
                    !pick.timestamp ||
                    Date.now() - pick.timestamp < 10000
                );
                // Only update state if something actually changed
                return filtered.length !== prev.length ? filtered : prev;
            });
        }, 10000); // Check every 10 seconds

        return () => clearInterval(cleanup);
    }, []);

    const addOptimisticPick = useCallback((pick: Omit<OptimisticPick, 'isOptimistic' | 'timestamp'>) => {
        const optimisticPick: OptimisticPick = {
            ...pick,
            isOptimistic: true,
            timestamp: Date.now()
        };
        setOptimisticPicks(prev => [...prev, optimisticPick]);
    }, []);

    const allPicks = useMemo(() => {
        const realPicks = initialPicks.map(pick => ({ ...pick, isOptimistic: false }));
        const validOptimisticPicks = optimisticPicks.filter(pick =>
            !realPicks.some(realPick =>
                realPick.playerId === pick.playerId &&
                realPick.divisionId === pick.divisionId
            )
        );

        return [...realPicks, ...validOptimisticPicks].sort((a, b) => a.pickNumber - b.pickNumber);
    }, [initialPicks, optimisticPicks]);

    return {
        optimisticPicks: allPicks,
        addOptimisticPick,
        hasOptimisticPicks: optimisticPicks.length > 0
    };
}
