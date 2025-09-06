import { useSearchParams } from 'react-router';
import styles from './time-travel-banner.module.css';

export const TimeTravelBanner = ({ currentGameweek }) => {
    const [searchParams] = useSearchParams();

    const handleGameweekChange = (gameweek: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('gameweek', gameweek.toString());
        setSearchParams(newParams);
    };
    return (
        <div className={styles.timeTravelBanner}>
            <span className={styles.timeTravelIcon}>⏰</span>
            Viewing Gameweek {searchParams.get('gameweek')}
            <button
                type={'button'}
                onClick={() => handleGameweekChange(currentGameweek)}
                className={styles.backToCurrentButton}
            >
                Back to Current
            </button>
        </div>
    );
};
