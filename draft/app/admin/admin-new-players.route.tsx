/* Location: app/admin/admin-new-players.route.tsx */

import { type ActionFunctionArgs, data, type MetaFunction, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { NewPlayersSection } from './components/sections/new-players-section';
import { AdminMessage } from './components/ui/admin-message';
import type { ActionResult, NewPlayersData } from './server/services/new-players.service';
import type { PositionBucket } from './types/new-players-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'New Players - Fantasy Football Admin' },
        { name: 'description', content: 'Approve positions for new players and release them into the game' },
    ];
};

export async function loader() {
    const { getNewPlayersData } = await import('./server/services/new-players.service');
    return await getNewPlayersData();
}

/**
 * Approve and release are separate intents because they are separate decisions: approving
 * records a position and holds the player, releasing is what actually puts them in front
 * of managers. Collapsing them into one submit would remove the pause the draw needs.
 */
export async function action({ request, context }: ActionFunctionArgs) {
    // Not `request.formData()`: on Firebase the body is already parsed by the time the SSR
    // handler runs, so the stream is spent and every field reads as empty. See form-data.ts.
    const formData = await requestFormData({ request, context });
    const intent = formData.get('intent') ?? '';
    const service = await import('./server/services/new-players.service');

    try {
        switch (intent) {
            case 'approve': {
                const approvals = JSON.parse(formData.get('approvals') ?? '[]') as Array<{
                    code: number;
                    position: PositionBucket;
                }>;
                return data<ActionResult>(await service.approveNewPlayers(approvals, new Date()));
            }
            case 'release': {
                const codes = JSON.parse(formData.get('codes') ?? '[]') as number[];
                return data<ActionResult>(await service.releasePlayers(codes));
            }
            default:
                return data<ActionResult>({ success: false, message: `Unknown intent: ${intent}` }, { status: 400 });
        }
    } catch (error) {
        // The sheet is the failure point worth naming -- a missing tab and a permissions
        // problem read identically as "it didn't work" unless the message is passed through.
        return data<ActionResult>({
            success: false,
            message: (error as Error)?.message ?? 'The write failed and nothing was changed.',
        });
    }
}

export default function AdminNewPlayersRoute() {
    const { newPlayers, heldPlayers, inboxAvailable, awaitingExport } = useLoaderData<NewPlayersData>();

    return (
        <>
            {!inboxAvailable && (
                <AdminMessage type="warning">
                    There is no <strong>PlayerInbox</strong> tab in the sheet, so no researched suggestions are
                    available. The page still works: choose a position yourself and approve.
                </AdminMessage>
            )}
            {awaitingExport > 0 && (
                <AdminMessage type="info">
                    {awaitingExport} {awaitingExport === 1 ? 'player is' : 'players are'} in FPL but not yet in the{' '}
                    <strong>FPL_Player_export</strong> tab, so they are not listed below. Adding them now would leave
                    their club, value and status as <strong>#N/A</strong>, because those columns look the code up in
                    that tab. Refresh it and they will appear here.
                </AdminMessage>
            )}
            <NewPlayersSection newPlayers={newPlayers} heldPlayers={heldPlayers} />
        </>
    );
}
