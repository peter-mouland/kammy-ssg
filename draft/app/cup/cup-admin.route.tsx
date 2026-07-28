/* Location: app/cup/cup-admin.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { readPlayerGameweekPointsFromSheet } from '../_shared/lib/sheets/player-gw-points';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupAdminPage } from './cup-admin.page';
import { fisherYatesShuffle, pairIntoMatchups } from './lib/knockout';
import {
    readCupBracket,
    readCupConfig,
    readCupSubmissions,
    writeCupBracket,
    writeCupConfig,
} from './server/cup-sheets';
import type { CupAdminPageData } from './types/cup-page-types';
import type { CupConfig } from './types/cup-types';

export const meta: MetaFunction = () => [{ title: 'Cup Admin - Fantasy Football Draft' }];

interface CupAdminActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

function parseGameweekList(value: string): number[] {
    return value
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((n) => !Number.isNaN(n));
}

export async function loader(_args: LoaderFunctionArgs) {
    try {
        const [config, bracket, submissions, pointsRows, userTeams] = await Promise.all([
            readCupConfig().catch(() => null),
            readCupBracket().catch(() => []),
            readCupSubmissions(),
            readPlayerGameweekPointsFromSheet(),
            readUserTeams(),
        ]);

        let qualifiers: CupAdminPageData['qualifiers'] = [];
        if (config) {
            const { getCupStandings } = await import('./server/cup.server');
            qualifiers = getCupStandings({ userTeams, cupConfig: config, submissions, pointsRows }).qualifiers;
        }

        return data<CupAdminPageData>({ config, qualifiers, bracket });
    } catch (error) {
        console.error('Cup admin loader error:', error);
        return data<CupAdminPageData>({ config: null, qualifiers: [], bracket: [] });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = String(formData.get('actionType') ?? '');

        if (actionType === 'setConfig') {
            const config: CupConfig = {
                season: String(formData.get('season') ?? ''),
                league: parseGameweekList(String(formData.get('league') ?? '')),
                r16: parseGameweekList(String(formData.get('r16') ?? '')).slice(0, 2) as [number, number],
                qf: parseGameweekList(String(formData.get('qf') ?? '')).slice(0, 2) as [number, number],
                sf: parseGameweekList(String(formData.get('sf') ?? '')).slice(0, 2) as [number, number],
                final: Number.parseInt(String(formData.get('final') ?? ''), 10),
            };
            await writeCupConfig(config);
            return data<CupAdminActionData>({ success: true, message: 'Cup gameweeks saved.' });
        }

        if (actionType === 'generateDraw') {
            const [config, submissions, pointsRows, userTeams] = await Promise.all([
                readCupConfig(),
                readCupSubmissions(),
                readPlayerGameweekPointsFromSheet(),
                readUserTeams(),
            ]);
            const { getCupStandings } = await import('./server/cup.server');
            const { qualifiers } = getCupStandings({ userTeams, cupConfig: config, submissions, pointsRows });
            if (qualifiers.length < 2) {
                return data<CupAdminActionData>({ success: false, error: 'Not enough qualifiers to draw yet.' });
            }
            const order = fisherYatesShuffle(
                qualifiers.map((q) => q.manager),
                () => Math.random(),
            );
            await writeCupBracket(pairIntoMatchups(order, 'r16'));
            return data<CupAdminActionData>({ success: true, message: 'Round of 16 draw generated.' });
        }

        return data<CupAdminActionData>({ success: false, error: `Unknown action: ${actionType}` });
    } catch (error) {
        console.error('Cup admin action error:', error);
        return data<CupAdminActionData>({
            success: false,
            error: error instanceof Error ? error.message : 'Cup admin action failed',
        });
    }
}

export default CupAdminPage;
