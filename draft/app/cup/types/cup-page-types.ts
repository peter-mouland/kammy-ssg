/* Location: app/cup/types/cup-page-types.ts */

import type { DivisionId, ManagerId, UserTeamsSheetData } from '../../teams/types/team-types';
import type { CupFixture } from '../lib/cup-fixtures';
import type { CupSquadPlayer } from '../lib/cup-squad';
import type { CupStanding } from '../lib/cup-standings';
import type { CupTeamVisibility } from '../lib/cup-visibility';
import type { CupConfig, CupMatchup, CupRound } from './cup-types';

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

/** A qualifier for the knockout stage — a manager and their league rank. */
export interface CupQualifier {
    manager: ManagerId;
    userName: string;
    rank: number;
}

/** An option in the cup gameweek selector. */
export interface CupGameweekOption {
    gameweek: number;
    label: string;
}

export interface CupPageData {
    hasConfig: boolean;
    round: CupRound | null;
    gameweek: number;
    deadlinePassed: boolean;
    rows: CupOverviewRow[];
    standings: CupStanding[];
    qualifiers: CupQualifier[];
    bracket: CupMatchup[];
    /** The gameweek being viewed, and all selectable cup gameweeks. */
    selectedGameweek: number;
    gameweekOptions: CupGameweekOption[];
    /** Real-world fixtures for the viewed gameweek. */
    fixtures: CupFixture[];
    /** Manager selection (shared cup header). */
    userTeams: UserTeamsSheetData[];
    selectedUserId: string | null;
}

export interface CupAdminPageData {
    config: CupConfig | null;
    qualifiers: CupQualifier[];
    bracket: CupMatchup[];
}

export interface CupSubmitPageData {
    hasConfig: boolean;
    round: CupRound | null;
    userTeams: UserTeamsSheetData[];
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
