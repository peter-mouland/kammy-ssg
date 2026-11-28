/* Location: app/cup/cup-admin.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { cupEligibleManagers } from '../_shared/lib/league-divisions';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import { readPlayerGameweekPointsFromSheet } from '../_shared/lib/sheets/player-gw-points';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupAdminPage } from './cup-admin.page';
import { leagueName } from './lib/cup-leagues';
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
        let leagues: CupAdminPageData['leagues'] = [];
        let managerCount = 0;
        let divisionsError = false;
        if (config) {
            const { getCupStandings } = await import('./server/cup.server');
            qualifiers = getCupStandings({ userTeams, cupConfig: config, submissions, pointsRows }).qualifiers;
            const { gameweekOptionLabel, resolveCupRounds } = await import('./lib/cup-config');
            gameweekOptions = resolveCupRounds(config).map((r) => ({
                gameweek: r.gameweek,
                label: gameweekOptionLabel(r),
            }));
            // A failed Divisions read is an outage, not zero managers: say so
            // on the page rather than letting the count read as a data problem.
            const divisions = await readDivisions().catch(() => null);
            if (divisions === null) divisionsError = true;
            const eligible = divisions === null ? [] : cupEligibleManagers(userTeams, divisions);
            managerCount = eligible.length;
            const userNameById = new Map(userTeams.map((team) => [team.userId, team.userName]));
            leagues = (config.leagues ?? []).map((managerIds, index) => ({
                name: leagueName(index),
                members: managerIds.map((manager) => userNameById.get(manager) ?? manager),
            }));
        }

        return data<CupAdminPageData>({
            config,
            qualifiers,
            bracket,
            gameweekOptions,
            leagues,
            managerCount,
            divisionsError,
        });
    } catch (error) {
        console.error('Cup admin loader error:', error);
        return data<CupAdminPageData>({
            config: null,
            qualifiers: [],
            bracket: [],
            gameweekOptions: [],
            leagues: [],
            managerCount: 0,
        });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = String(formData.get('actionType') ?? '');

        if (actionType === 'setConfig') {
            // Generated leagues live in the same config rows: keep them, or saving
            // gameweeks would silently un-generate the leagues.
            const existing = await readCupConfig().catch(() => null);
            const config: CupConfig = {
                season: String(formData.get('season') ?? ''),
                league: parseGameweekList(String(formData.get('league') ?? '')),
                r16: parseGameweekList(String(formData.get('r16') ?? '')).slice(0, 2) as [number, number],
                qf: parseGameweekList(String(formData.get('qf') ?? '')).slice(0, 2) as [number, number],
                sf: parseGameweekList(String(formData.get('sf') ?? '')).slice(0, 2) as [number, number],
                final: Number.parseInt(String(formData.get('final') ?? ''), 10),
                leagueSize: existing?.leagueSize ?? 0,
                leagues: existing?.leagues ?? [],
            };
            await writeCupConfig(config);
            return data<CupAdminActionData>({ success: true, message: 'Cup gameweeks saved.' });
        }

        if (actionType === 'generateLeagues') {
            const leagueSize = Number.parseInt(String(formData.get('leagueSize') ?? ''), 10);
            const [config, allUserTeams, divisions] = await Promise.all([
                readCupConfig(),
                readUserTeams(),
                readDivisions(),
            ]);
            // Never reshuffle the leagues mid-stage: once the first league
            // gameweek's deadline has passed, managers have been following
            // these tables. Same anti-clobber rule as advancing a round (#176).
            const firstLeagueGameweek = config.league[0];
            if (firstLeagueGameweek === undefined) {
                return data<CupAdminActionData>({
                    success: false,
                    error: 'Save the cup gameweeks first, then generate the leagues.',
                });
            }
            const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
            const events = await fplApiCache.getFplEvents();
            const firstEvent = events.find((event) => event.fplEvent.id === firstLeagueGameweek);
            const { isDeadlinePassed } = await import('./lib/cup-deadlines');
            if (firstEvent && isDeadlinePassed(firstEvent)) {
                return data<CupAdminActionData>({
                    success: false,
                    error: `The league stage started at GW${firstLeagueGameweek}, so the leagues can no longer be regenerated.`,
                });
            }
            const eligible = cupEligibleManagers(allUserTeams, divisions);
            if (eligible.length < 2) {
                return data<CupAdminActionData>({ success: false, error: 'Not enough cup managers to draw leagues.' });
            }
            const { generateLeagues } = await import('./lib/cup-leagues');
            let leagues: string[][];
            try {
                leagues = generateLeagues(
                    eligible.map((team) => team.userId),
                    leagueSize,
                );
            } catch (error) {
                return data<CupAdminActionData>({
                    success: false,
                    error: error instanceof Error ? error.message : 'Invalid league size.',
                });
            }
            await writeCupConfig({ ...config, leagueSize, leagues });
            return data<CupAdminActionData>({
                success: true,
                message: `Generated ${leagues.length} leagues from ${eligible.length} managers (${leagues
                    .map((league) => league.length)
                    .join(', ')} per league).`,
            });
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
