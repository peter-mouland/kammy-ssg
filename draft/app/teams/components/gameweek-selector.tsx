/* Location: app/teams/components/gameweek-selector.tsx */

// /teams/components/gameweek-selector.tsx
import React, { useState } from 'react';
import styles from './gameweek-selector.module.css';

interface GameweekSelectorProps {
    currentGameweek: number;
    selectedGameweek: number;
    availableGameweeks: number[];
    onGameweekChange: (gameweek: number) => void;
}

export const GameweekSelector: React.FC<GameweekSelectorProps> = ({
                                                                      currentGameweek,
                                                                      selectedGameweek,
                                                                      availableGameweeks,
                                                                      onGameweekChange
                                                                  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handlePrevious = () => {
        const currentIndex = availableGameweeks.indexOf(selectedGameweek);
        if (currentIndex > 0) {
            onGameweekChange(availableGameweeks[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        const currentIndex = availableGameweeks.indexOf(selectedGameweek);
        if (currentIndex < availableGameweeks.length - 1) {
            onGameweekChange(availableGameweeks[currentIndex + 1]);
        }
    };

    const canGoPrevious = availableGameweeks.indexOf(selectedGameweek) > 0;
    const canGoNext = availableGameweeks.indexOf(selectedGameweek) < availableGameweeks.length - 1;

    return (
        <div className={styles.gameweekSelector}>
            <div className={styles.selectorHeader}>
                <span className={styles.label}>Gameweek</span>
            </div>

            <div className={styles.selectorControls}>
                {/* Previous Button */}
                <button
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className={`${styles.navButton} ${styles.previousButton}`}
                    title="Previous gameweek"
                >
                    ⬅️
                </button>

                {/* Current Gameweek Display */}
                <div className={styles.gameweekDisplay}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={styles.gameweekButton}
                    >
                        <span className={styles.gameweekNumber}>{selectedGameweek}</span>
                        <span className={styles.dropdownIcon}>▼</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className={styles.gameweekDropdown}>
                            <div className={styles.dropdownContent}>
                                {availableGameweeks.map(gw => (
                                    <button
                                        key={gw}
                                        onClick={() => {
                                            onGameweekChange(gw);
                                            setIsOpen(false);
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
                            width: `${(availableGameweeks.indexOf(selectedGameweek) / 38) * 100}%`
                        }}
                    />
                    <div
                        className={styles.timelineThumb}
                        style={{
                            left: `${(availableGameweeks.indexOf(selectedGameweek) / 38) * 100}%`
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
