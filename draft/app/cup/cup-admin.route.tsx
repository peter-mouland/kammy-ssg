/* Location: app/cup/cup-admin.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { readPlayerGameweekPointsFromSheet } from '../_shared/lib/sheets/player-gw-points';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupAdminPage } from './cup-admin.page';
import { CUP_STAGES } from './lib/cup-rules';
import { fisherYatesShuffle, pairIntoMatchups } from './lib/knockout';
import {
    readCupBracket,
    readCupConfig,
    readCupSubmissions,
    writeCupBracket,
    writeCupConfig,
} from './server/cup-sheets';
import type { CupAdminPageData, CupGameweekOption } from './types/cup-page-types';
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
        let gameweekOptions: CupGameweekOption[] = [];
        if (config) {
            const { getCupStandings } = await import('./server/cup.server');
            qualifiers = getCupStandings({ userTeams, cupConfig: config, submissions, pointsRows }).qualifiers;
            const { resolveCupRounds } = await import('./lib/cup-config');
            gameweekOptions = resolveCupRounds(config).map((r) => ({
                gameweek: r.gameweek,
                label: `${CUP_STAGES[r.stage].label}${r.twoLegged ? ` L${r.leg}` : ''} · GW${r.gameweek}`,
            }));
        }

        return data<CupAdminPageData>({ config, qualifiers, bracket, gameweekOptions });
    } catch (error) {
        console.error('Cup admin loader error:', error);
        return data<CupAdminPageData>({ config: null, qualifiers: [], bracket: [], gameweekOptions: [] });
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

        if (actionType === 'resolveTie') {
            const stage = String(formData.get('stage') ?? '');
            const tie = Number.parseInt(String(formData.get('tie') ?? ''), 10);
            const { resolveTieAction } = await import('./server/actions/resolve-tie.action');
            const result = await resolveTieAction({ stage, tie });
            return data<CupAdminActionData>(result);
        }

        if (actionType === 'generateAutopicks') {
            const gameweek = Number.parseInt(String(formData.get('gameweek') ?? ''), 10);
            const { generateAutopicksAction } = await import('./server/actions/generate-autopicks.action');
            const result = await generateAutopicksAction({ gameweek });
            return data<CupAdminActionData>(result);
        }

        if (actionType === 'createPlayoff') {
            const stage = String(formData.get('stage') ?? '');
            const tie = Number.parseInt(String(formData.get('tie') ?? ''), 10);
            const gameweek = Number.parseInt(String(formData.get('gameweek') ?? ''), 10);
            const { createPlayoffAction } = await import('./server/actions/create-playoff.action');
            const result = await createPlayoffAction({ stage, tie, gameweek });
            return data<CupAdminActionData>(result);
        }

        if (actionType === 'advanceRound') {
            const stage = String(formData.get('stage') ?? '');
            const { advanceRoundAction } = await import('./server/actions/advance-round.action');
            const result = await advanceRoundAction({ stage });
            return data<CupAdminActionData>(result);
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
