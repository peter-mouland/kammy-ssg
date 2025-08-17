// app/teams/components/football-pitch.tsx
import type React from 'react';
import { getFormationSlots } from '../../_shared/lib/position-slot-utils';
import type { FormationDisplayProps } from '../types/team-types';
import styles from './football-pitch.module.css';
import { PositionSlotCard } from './position-slot-card';

export const FootballPitch: React.FC<FormationDisplayProps> = ({
    roster,
    gameweek,
    isHistorical,
    viewMode = 'season',
    teamsByCode,
    fplPlayersByCode,
}) => {
    const formationSlots = getFormationSlots();

    // Helper to render position group
    const renderPositionGroup = (slots: string[], _positionClass: string, groupLabel: string) => (
        <>
            {slots.map((slotKey, index) => {
                const positionSlot = roster[slotKey as keyof typeof roster];

                if (!positionSlot) {
                    // Empty slot
                    return (
                        <div key={slotKey} className={styles.emptySlot}>
                            <div className={styles.emptySlotLabel}>
                                {groupLabel} {index + 1}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={styles.playerPosition} key={slotKey}>
                        <PositionSlotCard
                            slot={slotKey as any}
                            positionSlot={positionSlot}
                            gameweek={gameweek}
                            isHistorical={isHistorical}
                            showPoints={true}
                            teamsByCode={teamsByCode}
                            fplPlayersByCode={fplPlayersByCode}
                            viewMode={viewMode}
                        />
                    </div>
                );
            })}
        </>
    );

    return (
        <div className={styles.footballPitch}>
            <div className={styles.pitchBackground}>
                {/* Goal */}
                <div className={styles.goal}>
                    <div className={styles.goalLine} />
                </div>

                {/* Formation Layout */}
                <div className={styles.formation}>
                    <div className={styles.centralAttackerLine}>
                        {renderPositionGroup(formationSlots.centralAttackers, 'attackers', 'CA')}
                    </div>
                    <div className={styles.wideAttackerLine}>
                        {renderPositionGroup(formationSlots.wideAttackers, 'wideAttackers', 'WA')}
                    </div>
                    <div className={styles.midfielderLine}>
                        {renderPositionGroup(formationSlots.midfielders, 'midfielders', 'MID')}
                    </div>

                    <div className={styles.fullbackLine}>
                        {renderPositionGroup(formationSlots.fullbacks, 'fullbacks', 'FB')}
                    </div>
                    <div className={styles.centrebackLine}>
                        {/* Centre Backs */}
                        {renderPositionGroup(formationSlots.centrebacks, 'centrebacks', 'CB')}
                    </div>
                    <div className={styles.goalkeeperLine}>
                        {/* Goalkeeper */}
                        {renderPositionGroup(formationSlots.goalkeeper, 'goalkeeper', 'GK')}
                        {renderPositionGroup(formationSlots.substitutes, 'substitutes', 'SUB')}
                    </div>
                </div>

                {/* Penalty Area */}
                <div className={styles.penaltyArea}>
                    <div className={styles.penaltyLine} />
                </div>
            </div>

            {/* Formation Info */}
            <div className={styles.formationInfo}>
                <div className={styles.gameweekInfo}>
                    {isHistorical
                        ? `Gameweek ${gameweek} (Historical)`
                        : `${viewMode === 'gameweek' ? `Gameweek ${gameweek}` : 'Season Totals'}`}
                </div>
            </div>
        </div>
    );
};
