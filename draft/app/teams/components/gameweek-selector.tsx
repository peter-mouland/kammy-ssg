/* Location: app/teams/components/gameweek-selector.tsx */

// /teams/components/gameweek-selector.tsx
import type React from 'react';
import { useState } from 'react';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import styles from './gameweek-selector.module.css';

interface GameweekSelectorProps {
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    onGameweekChange: (gameweek: number) => void;
}

export const GameweekSelector: React.FC<GameweekSelectorProps> = ({
    currentGameweekData,
    selectedGameweekData,
    availableGameweeks,
    onGameweekChange,
}) => {
    const selectedGameweek = selectedGameweekData.fplEvent.id;
    const currentGameweek = currentGameweekData.fplEvent.id;
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
                <div className={styles.label}>Gameweek</div>
            </div>

            <div className={styles.endData}>
                {selectedGameweekData.end.toLocaleDateString('en-gb')}
                {selectedGameweekData.end.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' })}
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
                                {availableGameweeks.map((gw) => (
                                    <button
                                        key={gw}
                                        type={'button'}
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
