/* Location: app/players/player.page.tsx */

import { Link, useLoaderData } from 'react-router';
import { PlayerDetail } from './components/player-detail';
import styles from './player.page.module.css';
import type { PlayerDetailData } from './types/player-types';

export const PlayerPage = () => {
    const data = useLoaderData<PlayerDetailData>();
    return (
        <div className={styles.playerDetailContainer}>
            {/* Navigation: page-only, so the transfer flow's player modal never shows it */}
            <div className={styles.breadcrumb}>
                <Link to="/players" className={styles.breadcrumbLink}>
                    ← Back to All Players
                </Link>
            </div>

            <PlayerDetail data={data} />
        </div>
    );
};
