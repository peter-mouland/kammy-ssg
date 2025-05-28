
// Mock timer for pick deadline
import { useEffect, useState } from 'react';


const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Timer = ({ minutesPerPick = 5 }) => {

    const [timeRemaining, setTimeRemaining] = useState(0);
    useEffect(() => {
        setTimeRemaining(minutesPerPick * 60);
        const timer = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ animation: timeRemaining < 30 ? "tilt-n-move-shaking 0.25s linear infinite" : "" }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.15rem' }}>
                <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: timeRemaining < 30 ? '#ef4444' : '#f59e0b'
                }}>
                    ⏰ {formatTime(timeRemaining)}
                </span>
            </div>
        </div>
    )
}
