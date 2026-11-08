import { useSearchParams } from 'react-router';
import styles from './time-travel-banner.module.css';

interface TimeTravelBannerProps {
    currentGameweek: number;
    /** Replaces "Viewing Gameweek N", for a page that is showing something other than one gameweek. */
    message?: string;
    /** Query params that also take the page away from "now", removed by Back to Current. */
    clearParams?: string[];
}

export const TimeTravelBanner = ({ currentGameweek, message, clearParams = [] }: TimeTravelBannerProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleBackToCurrent = () => {
        const newParams = new URLSearchParams(searchParams);
        for (const param of clearParams) newParams.delete(param);
        newParams.set('gameweek', currentGameweek.toString());
        setSearchParams(newParams);
    };

    return (
        <div className={styles.timeTravelBanner}>
            <span className={styles.timeTravelIcon}>⏰</span>
            {message ?? `Viewing Gameweek ${searchParams.get('gameweek')}`}
            <button type={'button'} onClick={handleBackToCurrent} className={styles.backToCurrentButton}>
                Back to Current
            </button>
        </div>
    );
};
