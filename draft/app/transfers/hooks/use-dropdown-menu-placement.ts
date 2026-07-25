/* Location: app/transfers/hooks/use-dropdown-menu-placement.ts */

import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react';

const MENU_MAX_HEIGHT_PX = 300;
const VIEWPORT_EDGE_GAP_PX = 8;
const MENU_MIN_HEIGHT_PX = 120;

interface UseDropdownMenuPlacementResult {
    opensUpward: boolean;
    menuMaxHeight: number;
}

/**
 * Positions a dropdown menu above or below its trigger based on available viewport space,
 * and caps max-height so options remain reachable on short screens.
 */
export function useDropdownMenuPlacement(
    isOpen: boolean,
    buttonRef: RefObject<HTMLElement | null>,
): UseDropdownMenuPlacementResult {
    const [opensUpward, setOpensUpward] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(MENU_MAX_HEIGHT_PX);

    const updateMenuPlacement = useCallback(() => {
        const button = buttonRef.current;
        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_EDGE_GAP_PX;
        const spaceAbove = rect.top - VIEWPORT_EDGE_GAP_PX;
        const shouldOpenUpward = spaceBelow < MENU_MAX_HEIGHT_PX && spaceAbove > spaceBelow;
        const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;

        setOpensUpward(shouldOpenUpward);
        setMenuMaxHeight(Math.max(MENU_MIN_HEIGHT_PX, Math.min(MENU_MAX_HEIGHT_PX, availableSpace)));
    }, [buttonRef]);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPlacement();
    }, [isOpen, updateMenuPlacement]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleReposition = () => {
            updateMenuPlacement();
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isOpen, updateMenuPlacement]);

    return { opensUpward, menuMaxHeight };
}
