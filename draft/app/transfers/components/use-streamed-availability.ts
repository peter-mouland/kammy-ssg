/* Location: app/transfers/components/use-streamed-availability.ts */

import { useEffect, useState } from 'react';
import type { AvailabilitySnapshot, AvailabilityState } from '../lib/player-availability';

/**
 * Follow the availability the loader streams after the page.
 *
 * A plain effect rather than `<Await>`: Suspense would show a fallback in place of the
 * whole transfer form and then swap it, throwing away anything already selected. Here the
 * form renders straight away and the icons arrive into it. With no promise (an older
 * cached page, or a test) it is simply unavailable.
 */
export function useStreamedAvailability(
    availability: Promise<AvailabilitySnapshot | null> | undefined,
): AvailabilityState {
    const [state, setState] = useState<AvailabilityState>(() =>
        availability ? { kind: 'loading' } : { kind: 'unavailable' },
    );

    useEffect(() => {
        if (!availability) {
            setState({ kind: 'unavailable' });
            return;
        }
        let current = true;
        setState({ kind: 'loading' });
        availability
            .then((snapshot) => {
                if (current) setState(snapshot ? { kind: 'ready', snapshot } : { kind: 'unavailable' });
            })
            .catch(() => {
                if (current) setState({ kind: 'unavailable' });
            });
        return () => {
            current = false;
        };
    }, [availability]);

    return state;
}
