/* Location: app/rules/rules.route.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../_shared/test/google-sheets-msw';
import * as route from './rules.route';

/**
 * Which published Google Doc /rules embeds. The `Rules Settings` tab in the league
 * spreadsheet is the source, so an admin can change it without a deploy; the
 * `GOOGLE_RULES_DOC_PUB_ID` env var is the fallback. The real sheets client runs behind
 * MSW, so a missing tab gets Google's real 400 and an outage a real 500.
 */

const SHEET_ID = '2PACX-from-the-sheet';
const ENV_ID = '2PACX-from-env';

const rulesSettingsTab = (...rows: string[][]) => ({ 'Rules Settings': [['key', 'value'], ...rows] });

const server = setupServer(googleAuthHandler);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    server.resetHandlers();
    dataCache.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});
afterAll(() => server.close());

const load = () => route.loader();

describe('rules loader', () => {
    it('embeds the doc named in the Rules Settings tab', async () => {
        server.use(sheetValuesHandler(rulesSettingsTab(['rulesDocPubId', SHEET_ID])));

        expect(await load()).toEqual({
            pubId: SHEET_ID,
            embedUrl: `https://docs.google.com/document/d/e/${SHEET_ID}/pub?embedded=true`,
            pubUrl: `https://docs.google.com/document/d/e/${SHEET_ID}/pub`,
        });
    });

    it('prefers the sheet over the env var, so a doc swap needs no deploy', async () => {
        vi.stubEnv('GOOGLE_RULES_DOC_PUB_ID', ENV_ID);
        server.use(sheetValuesHandler(rulesSettingsTab(['rulesDocPubId', `  ${SHEET_ID}  `])));

        expect((await load()).pubId).toBe(SHEET_ID);
    });

    it('falls back to the env var when the tab does not exist yet', async () => {
        vi.stubEnv('GOOGLE_RULES_DOC_PUB_ID', ENV_ID);
        server.use(sheetValuesHandler({}));

        expect((await load()).pubId).toBe(ENV_ID);
    });

    it('falls back to the env var when the tab has no rulesDocPubId value', async () => {
        vi.stubEnv('GOOGLE_RULES_DOC_PUB_ID', ENV_ID);
        server.use(sheetValuesHandler(rulesSettingsTab(['rulesDocPubId', ''], ['somethingElse', 'x'])));

        expect((await load()).pubId).toBe(ENV_ID);
    });

    it('still renders from the env var when Sheets is down', async () => {
        vi.stubEnv('GOOGLE_RULES_DOC_PUB_ID', ENV_ID);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        server.use(
            http.get('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', () =>
                HttpResponse.json({ error: { code: 500, message: 'backend error' } }, { status: 500 }),
            ),
        );

        expect((await load()).pubId).toBe(ENV_ID);
        // Degraded, not silent: the outage is logged for whoever reads the function logs.
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Rules Settings'), expect.anything());
    });

    it('reports not configured when neither the sheet nor env names a doc', async () => {
        vi.stubEnv('GOOGLE_RULES_DOC_PUB_ID', '');
        server.use(sheetValuesHandler({}));

        expect(await load()).toEqual({ pubId: null, embedUrl: null, pubUrl: null });
    });
});
