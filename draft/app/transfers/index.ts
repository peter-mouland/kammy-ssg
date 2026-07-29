/* Location: app/transfers/index.ts */

/**
 * The transfers domain's public API — the client-safe half.
 *
 * Everything else in this domain (`components/`, `server/`, internal helpers) is private.
 * If you need something that is not exported here, add it here rather than reaching past
 * this file — that is the whole point of the index.
 *
 * Anything touching Firebase, Sheets or `process.env` goes in `index.server.ts` instead,
 * so that importing this file from a component stays safe. See the decisions log in
 * .kiro/backlog.md (2026-07-28).
 */

// --- Loan status -------------------------------------------------------------
// How a loan reads on screen. `admin` embeds this in its transfers section: explaining a
// loan is the transfers domain's job, so it is exposed rather than promoted to _shared.
export { LoanStatusDisplay } from './components/loan-status-display';
// --- Applying transfers ------------------------------------------------------
// Folding approved transfers into a stored gameweek document. `scoring` does this while
// populating points -- deciding what a transfer *means* stays here.
export { applyTransfersToGameweekDocument } from './lib/transfer-integration.service';
// --- Types -------------------------------------------------------------------
export type {
    TransferAdminOverviewData,
    TransferRecommendation,
    TransferValidationResult,
} from './types/transfer-rule-types';
export type { ProcessedTransfer, ProcessedTransferSheetData } from './types/transfer-types';
