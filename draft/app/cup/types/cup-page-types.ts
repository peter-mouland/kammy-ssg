/* Location: app/cup/types/cup-page-types.ts */

import type { DivisionId, ManagerId } from '../../teams/types/team-types';
import type { CupSquadPlayer } from '../lib/cup-squad';
import type { CupTeamVisibility } from '../lib/cup-visibility';
import type { CupRound } from './cup-types';

/** One manager's row in the cup overview for the current round. */
export interface CupOverviewRow {
    manager: ManagerId;
    userName: string;
    teamName: string;
    division: DivisionId;
    visibility: CupTeamVisibility;
    /** Player codes — only populated when the team is revealed. */
    players: number[] | null;
    points: number | null;
}

export interface CupPageData {
    hasConfig: boolean;
    round: CupRound | null;
    gameweek: number;
    deadlinePassed: boolean;
    rows: CupOverviewRow[];
}

export interface CupSubmitPageData {
    hasConfig: boolean;
    round: CupRound | null;
    selectedUserId: string | null;
    selectedUserName: string | null;
    division: DivisionId | null;
    squad: CupSquadPlayer[];
    existingPlayers: number[];
    /** Players used in the other leg of this round (cannot be reused). */
    usedPlayers: number[];
    submissionOpen: boolean;
    deadline: string | null;
}
