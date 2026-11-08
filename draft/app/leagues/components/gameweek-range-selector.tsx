/* Location: app/leagues/components/gameweek-range-selector.tsx */

import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { GameweekRange } from '../lib/gameweek-range';
import styles from './gameweek-range-selector.module.css';

interface GameweekRangeSelectorProps {
    availableGameweeks: number[];
    selectedRange: GameweekRange | null;
}

const UNSET = '';

/**
 * Picks a run of gameweeks to total up, e.g. the weeks a monthly prize is played over.
 *
 * Two ends rather than a tick per week: a month is always an unbroken run, and 38
 * checkboxes are unusable on a phone. The choice lives in the URL so the link can be shared.
 */
export function GameweekRangeSelector({ availableGameweeks, selectedRange }: GameweekRangeSelectorProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [from, setFrom] = useState(selectedRange ? String(selectedRange.from) : UNSET);
    const [to, setTo] = useState(selectedRange ? String(selectedRange.to) : UNSET);

    const handleShow = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('gameweek');
        newParams.set('from', from);
        newParams.set('to', to);
        setSearchParams(newParams);
    };

    return (
        <fieldset className={styles.rangeSelector}>
            <legend className={styles.rangeLabel}>Combine gameweeks:</legend>
            <div className={styles.rangeControls}>
                <select
                    aria-label="From gameweek"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={styles.rangeInput}
                >
                    <option value={UNSET}>From</option>
                    {availableGameweeks.map((gw) => (
                        <option key={gw} value={gw}>
                            GW {gw}
                        </option>
                    ))}
                </select>
                <span className={styles.rangeSeparator}>to</span>
                <select
                    aria-label="To gameweek"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={styles.rangeInput}
                >
                    <option value={UNSET}>To</option>
                    {availableGameweeks.map((gw) => (
                        <option key={gw} value={gw}>
                            GW {gw}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleShow}
                    disabled={from === UNSET || to === UNSET}
                    className={styles.showButton}
                >
                    Show
                </button>
            </div>
        </fieldset>
    );
}
