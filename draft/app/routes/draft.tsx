// app/routes/draft.tsx
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { requestFormData } from '../lib/form-data';
import type { LoaderData, ActionData } from './draft/types'; // Move interfaces to separate file
import { DraftBoard } from '../components/draft-board';
import { DraftOrder } from '../components/draft-order';
import { TeamDraft } from '../components/draft-team';
import { DraftPlayersAvailable } from '../components/draft-players-availablle';
import { Timer } from '../components/timer';
import { SelectUser } from '../components/select-user';

export const meta: MetaFunction = () => {
    return [
        { title: "Live Draft - Fantasy Football Draft" },
        { name: "description", content: "Live fantasy football draft interface" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
        const { loadDraftData } = await import('./server/draft.server');
        const url = new URL(request.url);
        const loaderData = await loadDraftData(url);

        return data<LoaderData>(loaderData);
    } catch (error) {
        console.error("Draft loader error:", error);
        throw new Response("Failed to load draft data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType");

        switch (actionType) {
            case "makePick": {
                const { makeDraftPick } = await import('./server/draft.server');
                const result = await makeDraftPick(formData);
                return data<ActionData>(result);
            }
            default:
                return data<ActionData>({ error: "Invalid action type" });
        }
    } catch (error) {
        console.error("Draft action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

export default function Draft() {
    const {
        draftState, draftPicks, draftOrder, availablePlayers, currentUser, isUserTurn,
        divisions, userTeams, selectedDivision, selectedUser, draftSequence
    } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [, setSearchParams] = useSearchParams();
    const handleUserChange = (userId: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("user", userId);
            return newParams;
        });
    };


    const handleMakePick = (playerId: string) => {
        if (!currentUser || !selectedDivision) return;

        fetcher.submit({
            actionType: "makePick",
            playerId,
            userId: currentUser,
            divisionId: selectedDivision
        }, { method: "post" });
    };

    return (
        <div>
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {draftState?.isActive ? "🟢 Live " + divisions.find(d => d.id === draftState?.currentDivisionId)?.label + " Draft Room" : "⚪️ Draft Room"}
                </h1>
                <SelectUser users={userTeams} selectedUser={selectedUser} handleUserChange={handleUserChange} />
            </div>

            {/* Your Turn Alert */}
            {isUserTurn && (
                <div style={{
                    border: '1px solid #059669',
                    backgroundColor: 'rgb(240, 253, 244)',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#059669' }}>
                        🎯 It's Your Turn!
                    </h3>

                    <Timer />
                </div>
            )}

            {draftState?.isActive ?
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Available Players */}
                    <DraftPlayersAvailable onSelectPlayer={handleMakePick} availablePlayers={availablePlayers}
                                           isUserTurn={isUserTurn} />

                    {/* Right Column */}
                    <div  style={{ display: 'grid', gridTemplateRows: '0.7fr 1.3fr', gap: '2rem' }}>
                        {/* Draft Order */}
                        <DraftOrder draftOrder={draftOrder} draftPicks={draftPicks} draftSequence={draftSequence}
                                    draftState={draftState} />

                        {/* Draft Board */}
                        <DraftBoard draftPicks={draftPicks} />
                    </div>
                </div>
                : null
            }
           <TeamDraft draftPicks={draftPicks} draftOrder={draftOrder} />
        </div>
    );
}
