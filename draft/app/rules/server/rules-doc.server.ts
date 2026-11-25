/* Location: app/rules/server/rules-doc.server.ts */

import { readRulesSettings } from '../../_shared/lib/sheets/rules-settings';

/** The key in the `Rules Settings` tab that holds the published doc's `2PACX-…` ID. */
export const RULES_DOC_PUB_ID_KEY = 'rulesDocPubId';

/**
 * Which published Google Doc /rules embeds.
 *
 * The `Rules Settings` tab wins, so an admin can swap the doc without a deploy. The env
 * var is the fallback: it is what this used to be, and it keeps the page working when the
 * tab does not exist yet or Sheets is unreachable. A Sheets failure never fails the page.
 */
export async function resolveRulesDocPubId(): Promise<string | null> {
    const fromSheet = await readPubIdFromSheet();
    return fromSheet || process.env.GOOGLE_RULES_DOC_PUB_ID?.trim() || null;
}

async function readPubIdFromSheet(): Promise<string | null> {
    try {
        const settings = await readRulesSettings();
        return settings[RULES_DOC_PUB_ID_KEY] || null;
    } catch (error) {
        console.warn('[rules] could not read the Rules Settings tab, falling back to env:', error);
        return null;
    }
}
