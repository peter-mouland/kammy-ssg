/* Location: app/_shared/components/gameweek-range-form.tsx */

import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './gameweek-range-form.module.css';

/** Structurally the leagues `GameweekRange`; `_shared` cannot import a domain's types. */
export interface SelectedGameweekRange {
    from: number;
    to: number;
}

interface GameweekRangeFormProps {
    availableGameweeks: number[];
    selectedRange: SelectedGameweekRange | null;
    onBack: () => void;
    onDone: () => void;
}

const UNSET = '';

/** The query params a range is carried in. Anything that picks a single gameweek clears them. */
export const GAMEWEEK_RANGE_PARAMS = ['from', 'to'] as const;

/**
 * Picks a run of gameweeks to total up, e.g. the weeks a monthly prize is played over.
 *
 * Two ends rather than a tick per week: a month is always an unbroken run, and 38
 * checkboxes are unusable on a phone. The choice lives in the URL so the link can be shared.
 */
export function GameweekRangeForm({ availableGameweeks, selectedRange, onBack, onDone }: GameweekRangeFormProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [from, setFrom] = useState(selectedRange ? String(selectedRange.from) : UNSET);
    const [to, setTo] = useState(selectedRange ? String(selectedRange.to) : UNSET);
    const gameweeks = [...availableGameweeks].sort((a, b) => a - b);

    const handleShow = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('gameweek');
        newParams.set('from', from);
        newParams.set('to', to);
        setSearchParams(newParams);
        onDone();
    };

    return (
        <div className={styles.rangeForm}>
            <button type="button" onClick={onBack} className={styles.backButton}>
                ‹ Back
            </button>
            <label className={styles.rangeRow}>
                <span className={styles.rangeLabel}>From</span>
                <select
                    aria-label="From gameweek"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={styles.rangeInput}
                >
                    <option value={UNSET}>–</option>
                    {gameweeks.map((gw) => (
                        <option key={gw} value={gw}>
                            GW {gw}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.rangeRow}>
                <span className={styles.rangeLabel}>To</span>
                <select
                    aria-label="To gameweek"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={styles.rangeInput}
                >
                    <option value={UNSET}>–</option>
                    {gameweeks.map((gw) => (
                        <option key={gw} value={gw}>
                            GW {gw}
                        </option>
                    ))}
                </select>
            </label>
            <button
                type="button"
                onClick={handleShow}
                disabled={from === UNSET || to === UNSET}
                className={styles.showButton}
            >
                Show
            </button>
        </div>
    );
}
