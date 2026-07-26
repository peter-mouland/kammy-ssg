/* Location: app/players/player-json.route.ts */

import type { LoaderFunctionArgs } from 'react-router';
import type { DataSource } from './types/player-types';

export async function loader({ params, request }: LoaderFunctionArgs) {
    const playerCode = params.playerCode;

    if (!playerCode || Number.isNaN(Number(playerCode))) {
        throw new Response('Invalid player Code', { status: 400 });
    }

    try {
        const url = new URL(request.url);
        const source = (url.searchParams.get('source') || 'fpl') as DataSource;

        const { getPlayerDetailData } = await import('./server/player.server');
        const playerDetailData = await getPlayerDetailData(Number(playerCode), source);

        if (!playerDetailData.player) {
            throw new Response('Player not found', { status: 404 });
        }

        const { player, team, position, seasonTotals, gameweekStats, fixtures, fplTeamsById } = playerDetailData;

        const body = {
            player: {
                name: player.web_name,
                firstName: player.first_name,
                lastName: player.second_name,
            },
            team: { name: team.name, shortName: team.short_name },
            position,
            seasonTotals,
            form: seasonTotals.form,
            pointsBreakdown: player.draft.pointsBreakdown,
            gameweekStats,
            fixtures: (fixtures ?? []).map((f) => ({
                gameweek: f.event,
                kickoffTime: f.kickoff_time,
                isHome: f.is_home,
                difficulty: f.difficulty,
                opponent: f.is_home
                    ? (fplTeamsById[f.team_a]?.short_name ?? String(f.team_a))
                    : (fplTeamsById[f.team_h]?.short_name ?? String(f.team_h)),
            })),
        };

        return new Response(JSON.stringify(body), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Player JSON loader error:', error);
        if (error instanceof Response) {
            throw error;
        }
        throw new Response('Failed to load player data', { status: 500 });
    }
}
