// app/teams/components/position-slot-card.tsx
import type React from 'react';
import { Link } from 'react-router';
import { PlayerSummaryPoints } from '../../_shared/components/player';
import type { PositionSlotCardProps } from '../types/team-types';
import styles from './position-slot-card.module.css';

const formatPoints = (points: number) => {
    return points < 0 ? `-${points}` : points.toString();
};

export const PositionSlotCard: React.FC<PositionSlotCardProps> = ({
    positionSlot,
    isSubstitute = false,
    showPoints = true,
    viewMode = 'season',
    teamsByCode,
    fplPlayersByCode,
}) => {
    const { player } = positionSlot;
    const displayPoints = showPoints ? positionSlot[viewMode].points : null;

    return (
        <Link
            className={`${styles.positionSlotCard} ${isSubstitute ? styles.substitute : ''}`}
            to={`/players/${player.playerCode}`}
        >
            <PlayerSummaryPoints
                player={player}
                teamsByCode={teamsByCode}
                fplPlayersByCode={fplPlayersByCode}
                points={showPoints && displayPoints ? formatPoints(displayPoints.total) : null}
                onLoanTo={player.onLoanTo || player.onLoanFrom}
            />
        </Link>
    );
};
