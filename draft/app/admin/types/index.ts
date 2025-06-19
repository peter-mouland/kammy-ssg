// app/admin/types/index.ts

// Re-export all admin types
export * from './admin-types';

// Re-export domain types that are commonly used in admin
// FIXED: Import from proper domain locations instead of shared types
export type {
    DivisionData,
    UserTeamData,
} from '../../teams/types/team-types';

export type {
    DraftOrderData,
    DraftStateData,
} from '../../draft/types/draft-types';

export type {
    FplPlayerData
} from '../../players/types/player-types';
