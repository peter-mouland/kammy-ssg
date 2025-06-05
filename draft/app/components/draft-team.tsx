// components/draft-team.tsx (fixed version)
import type { DraftPickData } from "../types";
import { getPositionDisplayName } from '../lib/points';
import styles from './draft-team.module.css';

interface DraftTeamProps {
    userId: string;
    userName: string;
    draftPicks: DraftPickData[];
    isCompact?: boolean;
}

interface PositionSlot {
    id: string;
    position: string;
    player?: DraftPickData;
    isEmpty: boolean;
}

interface TeamFormation {
    userId: string;
    userName: string;
    positions: {
        gk: PositionSlot[];
        cb: PositionSlot[];
        fb: PositionSlot[];
        mid: PositionSlot[];
        wa: PositionSlot[];
        ca: PositionSlot[];
        sub: PositionSlot[];
    };
}

const createUserFormation = (userPicks, userId, userName): TeamFormation => {
    console.log(`Creating formation for ${userName}:`, userPicks); // Debug log

    const formation: TeamFormation = {
        userId,
        userName,
        positions: {
            gk: [{ id: `${userId}-gk-1`, position: 'gk', isEmpty: true }],
            cb: [
                { id: `${userId}-cb-1`, position: 'cb', isEmpty: true },
                { id: `${userId}-cb-2`, position: 'cb', isEmpty: true }
            ],
            fb: [
                { id: `${userId}-fb-1`, position: 'fb', isEmpty: true },
                { id: `${userId}-fb-2`, position: 'fb', isEmpty: true }
            ],
            mid: [
                { id: `${userId}-mid-1`, position: 'mid', isEmpty: true },
                { id: `${userId}-mid-2`, position: 'mid', isEmpty: true }
            ],
            wa: [
                { id: `${userId}-wa-1`, position: 'wa', isEmpty: true },
                { id: `${userId}-wa-2`, position: 'wa', isEmpty: true }
            ],
            ca: [
                { id: `${userId}-ca-1`, position: 'ca', isEmpty: true },
                { id: `${userId}-ca-2`, position: 'ca', isEmpty: true }
            ],
            sub: [{ id: `${userId}-sub-1`, position: 'sub', isEmpty: true }]
        }
    };

    // Place picked players into formation
    userPicks.forEach((pick, index) => {
        const customPosition = pick.position;
        const positionSlots = formation.positions[customPosition.toLowerCase() as keyof typeof formation.positions];

        if (positionSlots) {
            const emptySlot = positionSlots.find(slot => slot.isEmpty);
            if (emptySlot) {
                emptySlot.player = pick;
                emptySlot.isEmpty = false;
            } else {
                const subSlot = formation.positions.sub.find(slot => slot.isEmpty);
                if (subSlot) {
                    subSlot.player = pick;
                    subSlot.isEmpty = false;
                }
            }
        } else {
            // Unknown position, put in sub
            const subSlot = formation.positions.sub.find(slot => slot.isEmpty);
            if (subSlot) {
                subSlot.player = pick;
                subSlot.isEmpty = false;
            }
        }
    });

    return formation;
};

// Render position slot
const PositionSlot = (slot: PositionSlot) => {
    const slotClasses = [
        styles.positionSlot,
        styles[slot.position], // Position-specific styles
        slot.isEmpty ? styles.empty : styles.filled
    ].join(' ');

    const textClasses = [
        styles.emptySlotText,
        styles[slot.position]
    ].join(' ');
console.log(slot)
    return (
        <div key={slot.id} className={slotClasses}>
            {slot.isEmpty ? (
                <span className={textClasses}>
                    {getPositionDisplayName(slot.position)}
                </span>
            ) : (
                <div className={styles.playerInfo}>
                    <div className={styles.playerName}>
                        {slot.player?.playerName}
                    </div>
                    <div className={styles.playerPosition}>
                        {getPositionDisplayName(slot.position)}
                    </div>
                    <div className={styles.playerPosition}>
                        {slot.player?.teamName}
                    </div>
                </div>
            )}
        </div>
    );
};

export function DraftTeam({ userId, userName, draftPicks, isCompact = false }: DraftTeamProps) {
    // Create formation for a specific user
    const userPicks = draftPicks.filter(pick => pick.userId === userId);
    const formation = createUserFormation(userPicks, userId, userName);
    const userPicksCount = userPicks.length; // Fixed: use userPicks.length instead of filtering again
    return (
        <div className={`${styles.teamCard} ${isCompact ? styles.compact : ''}`}>
            {/* Team Header */}
            <div className={styles.teamHeader}>
                <h3 className={styles.teamName}>
                    {userName}
                </h3>
                <span className={`${styles.playerCount} ${userPicksCount >= 12 ? styles.complete : ''}`}>
                    {userPicksCount}/12 players
                </span>
            </div>

            {/* Formation Grid */}
            <div className={styles.formationGrid}>
                {/* GK Column */}
                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        GK (1) SUB (1)
                    </div>
                    {formation.positions.gk.map(PositionSlot)}
                    {formation.positions.sub.map(PositionSlot)}
                </div>

                {/* Defense Columns */}
                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        CB (2)
                    </div>
                    {formation.positions.cb.map(PositionSlot)}
                </div>

                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        FB (2)
                    </div>
                    {formation.positions.fb.map(PositionSlot)}
                </div>

                {/* Midfield Column */}
                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        MID (2)
                    </div>
                    {formation.positions.mid.map(PositionSlot)}
                </div>

                {/* Attack Columns */}
                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        WA (2)
                    </div>
                    {formation.positions.wa.map(PositionSlot)}
                </div>

                <div className={styles.positionColumn}>
                    <div className={styles.positionHeader}>
                        CA (2)
                    </div>
                    {formation.positions.ca.map(PositionSlot)}
                </div>
            </div>
        </div>
    );
}
