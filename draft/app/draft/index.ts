/* Location: app/draft/index.ts */

/**
 * The draft domain's public API.
 *
 * This is the only file other domains may import from. `components/`, `server/` and the
 * internal helpers behind these exports are private — see
 * `.kiro/steering/ai-contribution-rules.md`, "A domain is reached only through its
 * public API", enforced by `architecture.test.ts`.
 *
 * `admin` is the main consumer: orchestrating the draft is its job, and before this file
 * existed it had no legal way to do it, so it reached into `_shared` and `draft/server`
 * instead. Add an export here when another domain genuinely needs an operation — not to
 * make an import compile.
 */

// --- The snake ---------------------------------------------------------------
export { calculateCurrentPick, calculateCurrentUserId } from './lib/draft-pick-calculator';
// --- Draft rules -------------------------------------------------------------
// Squad shape and eligibility. `players`, `transfers` and `scoring` all ask these
// questions about a squad, so they are part of the contract rather than internal.
export { DRAFT_RULES, getPlayerPosition, getSquadComposition, validateDraftEligibility } from './lib/draft-rules';
// --- Draft state -------------------------------------------------------------
// `currentPick` is derived from the picks a division has made, not stored. These turn
// raw sheet rows into that derived state; the sheets readers deliberately do not.
export { toDraftStateForDivision, toDraftStates } from './lib/draft-state';
export { generateDraftSequence } from './lib/generate-draft-sequence';
// --- Types -------------------------------------------------------------------
// The draft concepts other domains model against. Owned here; imported everywhere.
export type {
    DraftActionData,
    DraftDivisionStatus,
    DraftLoaderData,
    DraftOrderData,
    DraftPickData,
    DraftSequence,
    DraftSequenceEntry,
    DraftStage,
    DraftStateData,
    DraftStatusByDivisionId,
    DraftStatusData,
    DraftSyncComparison,
    DraftSyncDifference,
    FirebaseDraftPick,
    FirebaseDraftState,
    PositionCounts,
    SquadComposition,
    TeamCounts,
} from './types/draft-types';

// --- Server-only operations are NOT here -------------------------------------
// `FirebaseDraftSync` lives in `./index.server`, deliberately.
//
// It reaches `_shared/lib/firestore-cache/firebase.realtime-admin`, which parses a
// service account from `process.env` at MODULE SCOPE. Re-exporting it here would make
// this file server-only, and any client component importing `../../draft` would pull in
// firebase-admin and blow up on `process`.
//
// Keep this file safe to import from a component. Anything touching Firebase, Sheets or
// `process.env` belongs in `index.server.ts`.
