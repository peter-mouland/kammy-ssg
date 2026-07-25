/* Location: app/transfers/hooks/use-click-outside.ts */

import { type RefObject, useEffect } from 'react';

/**
 * Calls `onOutside` when a mousedown happens outside `ref`, while `enabled` is true.
 */
export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    onOutside: () => void,
    enabled: boolean,
): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onOutside();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, onOutside, enabled]);
}
