/* Location: app/_shared/components/gameweek-selector.tsx */

import type React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { GameWeekData } from '../lib/fpl/fpl-types';
import styles from './gameweek-selector.module.css';

interface GameweekSelectorProps {
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    showSeasonOption?: boolean;
    isSeasonSelected?: boolean;
}

export const GameweekSelector: React.FC<GameweekSelectorProps> = ({
    currentGameweekData,
    selectedGameweekData,
    availableGameweeks,
    showSeasonOption = false,
    isSeasonSelected = false,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    const handleGameweekChange = (gameweek: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('gameweek', gameweek.toString());
        setIsOpen(false);
        setSearchParams(newParams, { replace: true });
    };

    const handleSeasonSelect = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('gameweek', 'season');
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
    const canGoPrevious = isSeasonSelected || selectedGameweek > 1;
    const canGoNext = isSeasonSelected ? false : selectedGameweek < availableGameweeks.length || showSeasonOption;

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
                    <button type={'button'} onClick={() => setIsOpen(!isOpen)} className={styles.gameweekButton}>
                        <span className={styles.gameweekNumber}>{isSeasonSelected ? 'Season' : selectedGameweek}</span>
                        <span className={styles.dropdownIcon}>▼</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className={styles.gameweekDropdown}>
                            <div className={styles.dropdownContent}>
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
                                            ${!isSeasonSelected && gw === selectedGameweek ? styles.selected : ''}
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
