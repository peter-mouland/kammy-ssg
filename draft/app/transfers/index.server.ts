/* Location: app/transfers/index.server.ts */

/**
 * The transfers domain's SERVER-ONLY public API.
 *
 * Split from `index.ts` because this reaches the Sheets readers and `fplApiCache`.
 * Re-exporting it from `index.ts` would make the whole public API unsafe to import from
 * a component, and the failure would be a runtime crash in the browser rather than a
 * build error.
 *
 * Rule of thumb: if it touches Firestore, Sheets or `process.env`, it goes here.
 */

// --- Reading and interpreting the Transfers sheet -----------------------------
// Normalises raw sheet rows into ProcessedTransfers (P2.3). It reaches the Sheets
// readers, which is why it is here and not in index.ts despite living in lib/.
export { readTransferDataForDivision } from './lib/transfer-rows';
// --- Transfer data for a division --------------------------------------------
// The division's transfers, validated. `admin` needs this to build its transfer approval
// screen and its system-status report, which is what admin is for — it had no legal way
// to ask for it before, hence the two allowlist entries this replaces.
export { getTransfersDataForDivision } from './server/services/transfers-data.service';
