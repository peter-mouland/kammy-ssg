// components/draft-teams.tsx (multiple teams view)
import type { DraftPickData, DraftOrderData } from "../types";
import { DraftTeam } from './draft-team';
import styles from './draft-team.module.css';

interface DraftTeamsProps {
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
}

export function DraftTeams({ draftPicks, draftOrder }: DraftTeamsProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Team Formations</h2>
            </div>

            <div className={styles.teamContainer}>
                {draftOrder.map(order => (
                    <DraftTeam
                        key={order.userId}
                        userId={order.userId}
                        userName={order.userName}
                        draftPicks={draftPicks}
                        isCompact={false}
                    />
                ))}
            </div>
        </div>
    );
}
