/* Location: app/_shared/components/gameweek-selector.tsx */

import type React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { GameWeekData } from '../lib/fpl/fpl-types';
import { GAMEWEEK_RANGE_PARAMS, GameweekRangeForm, type SelectedGameweekRange } from './gameweek-range-form';
import styles from './gameweek-selector.module.css';

interface GameweekSelectorProps {
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    showSeasonOption?: boolean;
    isSeasonSelected?: boolean;
    /** Offers "Combine gameweeks" in the dropdown. Opt-in: most pages show one gameweek. */
    showRangeOption?: boolean;
    /** The range on screen, if any; the selector then labels and opens on it. */
    selectedRange?: SelectedGameweekRange | null;
}

const LIST_VIEW = 'list';
const RANGE_VIEW = 'range';
type DropdownView = typeof LIST_VIEW | typeof RANGE_VIEW;

export const GameweekSelector: React.FC<GameweekSelectorProps> = ({
    currentGameweekData,
    selectedGameweekData,
    availableGameweeks,
    showSeasonOption = false,
    isSeasonSelected = false,
    showRangeOption = false,
    selectedRange = null,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownView, setDropdownView] = useState<DropdownView>(LIST_VIEW);

    const toggleDropdown = () => {
        // A range on screen opens on the range, ready to adjust; otherwise the gameweek list.
        setDropdownView(selectedRange ? RANGE_VIEW : LIST_VIEW);
        setIsOpen(!isOpen);
    };

    /** A single gameweek (or the season) replaces any range: the range would otherwise win. */
    const singleGameweekParams = (gameweek: string) => {
        const newParams = new URLSearchParams(searchParams);
        for (const param of GAMEWEEK_RANGE_PARAMS) newParams.delete(param);
        newParams.set('gameweek', gameweek);
        return newParams;
    };

    const handleGameweekChange = (gameweek: number) => {
        const newParams = singleGameweekParams(gameweek.toString());
        setIsOpen(false);
        setSearchParams(newParams, { replace: true });
    };

    const handleSeasonSelect = () => {
        const newParams = singleGameweekParams('season');
        setIsOpen(false);
        setSearchParams(newParams, { replace: true });
    };

    const handlePrevious = () => {
        if (isSeasonSelected) {
            handleGameweekChange(availableGameweeks[availableGameweeks.length - 1]);
            return;
        }
        handleGameweekChange(selectedGameweek - 1);
    };

    const handleNext = () => {
        if (showSeasonOption && selectedGameweek >= availableGameweeks.length) {
            handleSeasonSelect();
            return;
        }
        handleGameweekChange(selectedGameweek + 1);
    };

    const selectedGameweek = selectedGameweekData?.fplEvent.id || 1;
    const currentGameweek = currentGameweekData?.fplEvent.id || 1;

    /**
     * The deadline, if there is a usable one.
     *
     * `selectedGameweekData?.end` guarded the object but not the field, so a gameweek
     * without a deadline crashed the whole page on `.toLocaleDateString`. `end` also comes
     * back as an ISO **string** rather than a Date on the paths that read it straight out
     * of Firestore, and a string has no such method either -- hence `new Date()` rather
     * than an `instanceof` check.
     */
    const parsedDeadline = selectedGameweekData?.end ? new Date(selectedGameweekData.end) : null;
    const deadline = parsedDeadline && !Number.isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;
    // Stepping one gameweek has no clear meaning for a range; the banner's Back to Current is the way out.
    const canGoPrevious = !selectedRange && (isSeasonSelected || selectedGameweek > 1);
    const canGoNext =
        !selectedRange && (isSeasonSelected ? false : selectedGameweek < availableGameweeks.length || showSeasonOption);
    const buttonLabel = isSeasonSelected
        ? 'Season'
        : selectedRange
          ? `${selectedRange.from}–${selectedRange.to}`
          : selectedGameweek;

    return (
        <div className={styles.gameweekSelector}>
            <div className={styles.selectorHeader}>
                <div className={styles.label}>Gameweek Deadline:</div>
                <div className={styles.endData}>
                    <span>{deadline ? deadline.toLocaleDateString('en-gb') : '—'}</span>
                    <span>
                        {deadline ? deadline.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
            </div>

            <div className={styles.selectorControls}>
                {/* Previous Button */}
                <button
                    type={'button'}
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className={`${styles.navButton} ${styles.previousButton}`}
                    title="Previous gameweek"
                >
                    ⬅️
                </button>

                {/* Current Gameweek Display */}
                <div className={styles.gameweekDisplay}>
                    <button type={'button'} onClick={toggleDropdown} className={styles.gameweekButton}>
                        <span className={styles.gameweekNumber}>{buttonLabel}</span>
                        <span className={styles.dropdownIcon}>▼</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && dropdownView === RANGE_VIEW && (
                        <div className={`${styles.gameweekDropdown} ${styles.rangeDropdown}`}>
                            <div className={styles.dropdownContent}>
                                <GameweekRangeForm
                                    availableGameweeks={availableGameweeks}
                                    selectedRange={selectedRange}
                                    onBack={() => setDropdownView(LIST_VIEW)}
                                    onDone={() => setIsOpen(false)}
                                />
                            </div>
                        </div>
                    )}
                    {isOpen && dropdownView === LIST_VIEW && (
                        <div className={styles.gameweekDropdown}>
                            <div className={styles.dropdownContent}>
                                {showRangeOption && (
                                    <button
                                        type={'button'}
                                        onClick={() => setDropdownView(RANGE_VIEW)}
                                        className={`${styles.gameweekOption} ${styles.rangeOption}`}
                                    >
                                        <span>⊕ Combine gameweeks</span>
                                    </button>
                                )}
                                {showSeasonOption && (
                                    <button
                                        type={'button'}
                                        onClick={handleSeasonSelect}
                                        className={`
                                            ${styles.gameweekOption}
                                            ${isSeasonSelected ? styles.selected : ''}
                                        `}
                                    >
                                        <span>Season Totals</span>
                                    </button>
                                )}
                                {availableGameweeks
                                    .sort((gwa, gwb) => (gwa > gwb ? -1 : 1))
                                    .map((gw) => (
                                        <button
                                            key={gw}
                                            type={'button'}
                                            onClick={() => {
                                                handleGameweekChange(gw);
                                            }}
                                            className={`
                                            ${styles.gameweekOption}
                                            ${!isSeasonSelected && !selectedRange && gw === selectedGameweek ? styles.selected : ''}
                                            ${gw === currentGameweek ? styles.current : ''}
                                        `}
                                        >
                                            <span>GW {gw}</span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Button */}
                <button
                    type={'button'}
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={`${styles.navButton} ${styles.nextButton}`}
                    title="Next gameweek"
                >
                    ➡️
                </button>
            </div>

            {/* Timeline Indicator */}
            <div className={styles.timeline}>
                <div className={styles.timelineTrack}>
                    <div
                        className={styles.timelineProgress}
                        style={{
                            width: `${(availableGameweeks.indexOf(selectedGameweek) / 38) * 100}%`,
                        }}
                    />
                    <div
                        className={styles.timelineThumb}
                        style={{
                            left: `${(availableGameweeks.indexOf(selectedGameweek) / 38) * 100}%`,
                        }}
                    />
                </div>
                <div className={styles.timelineLabels}>
                    <span className={styles.timelineStart}>Draft</span>
                    <span className={styles.timelineEnd}>GW 38</span>
                </div>
            </div>
        </div>
    );
};
