import { useEffect, useState } from 'react';
import styles from './timer.module.css';

interface TimerProps {
    minutesPerPick?: number;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function Timer({ minutesPerPick = 5 }: TimerProps) {
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        setTimeRemaining(minutesPerPick * 60);
        const timer = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [minutesPerPick]);

    const getTimerClasses = () => {
        if (timeRemaining < 30) return styles.attentionImportantShake;
        if (timeRemaining < 120) return styles.attentionShake;
        return '';
    };

    const getTimeColor = () => {
        return timeRemaining < 30 ? styles.urgent : styles.warning;
    };

    return (
        <div className={getTimerClasses()}>
            <div className={styles.timerDisplay}>
                <span className={`${styles.timeText} ${getTimeColor()}`}>
                    ⏰ {formatTime(timeRemaining)}
                </span>
            </div>
        </div>
    );
}
