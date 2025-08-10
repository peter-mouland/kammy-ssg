/* Location: app/teams/components/gameweek-selector.tsx */

// /teams/components/gameweek-selector.tsx
import type React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import styles from './gameweek-selector.module.css';

interface GameweekSelectorProps {
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    onGameweekChange?: (gameweek: number) => void;
}

export const GameweekSelector: React.FC<GameweekSelectorProps> = ({
    currentGameweekData,
    selectedGameweekData,
    availableGameweeks,
    onGameweekChange,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const handleGameweekChange = (gameweek: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('gameweek', gameweek.toString());
        setSearchParams(newParams);
        setIsOpen(false);
        onGameweekChange?.(gameweek);
    };

    const selectedGameweek = selectedGameweekData?.fplEvent.id || 0;
    const currentGameweek = currentGameweekData?.fplEvent.id || 0;
    const [isOpen, setIsOpen] = useState(false);

    const handlePrevious = () => {
        handleGameweekChange(selectedGameweek - 1);
    };

    const handleNext = () => {
        handleGameweekChange(selectedGameweek + 1);
    };

    const canGoPrevious = selectedGameweek > 0;
    const canGoNext = selectedGameweek < availableGameweeks.length - 1;

    return (
        <div className={styles.gameweekSelector}>
            <div className={styles.selectorHeader}>
                <div className={styles.label}>Gameweek Deadline:</div>
            </div>

            <div className={styles.endData}>
                <span>{selectedGameweekData?.end.toLocaleDateString('en-gb')}</span>
                <span>
                    {selectedGameweekData?.end.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' })}
                </span>
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
                        <span className={styles.gameweekNumber}>{selectedGameweek}</span>
                        <span className={styles.dropdownIcon}>▼</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className={styles.gameweekDropdown}>
                            <div className={styles.dropdownContent}>
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
                                            ${gw === selectedGameweek ? styles.selected : ''}
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
