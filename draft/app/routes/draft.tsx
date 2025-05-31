import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData,  useFetcher, useSearchParams } from "react-router";
import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from "./server/sheets/draft";
import { getDraftOrderByDivision } from "./server/sheets/draftOrder";
import { readDivisions } from "./server/sheets/divisions";
import { readUserTeams } from "./server/sheets/userTeams";
import { requestFormData } from '../lib/form-data';
import { getFplPlayers, searchPlayersByName } from "./server/fpl/api";
import { getNextDraftState, generateDraftSequence } from "../lib/draft/helpers";
import type { DraftStateData, DraftPickData, DraftOrderData, FplPlayerData, DivisionData, UserTeamData } from "../types";
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

interface LoaderData {
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    availablePlayers: FplPlayerData[];
    currentUser: string | null;
    isUserTurn: boolean;
    divisions: DivisionData[];
    userTeams: UserTeamData[];
    selectedDivision?: string;
    selectedUser?: string;
    draftSequence: Array<{
        pickNumber: number;
        round: number;
        userId: string;
        userName: string;
        position: number;
    }>;
}

interface ActionData {
    success?: boolean;
    error?: string;
    pick?: DraftPickData;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const selectedUser = url.searchParams.get("user") || "";
        const search = url.searchParams.get("search") || "";
        const position = url.searchParams.get("position") || "";

        // Fetch all required data
        const [draftState, divisions, userTeams, allPlayers] = await Promise.all([
            readDraftState(),
            readDivisions(),
            readUserTeams(),
            getFplPlayers()
        ]);

        // Use first division if none selected
        const divisionId = draftState?.currentDivisionId || divisions[0]?.id || "";

        let draftPicks: DraftPickData[] = [];
        let draftOrder: DraftOrderData[] = [];
        let draftSequence: any[] = [];


        if (divisionId) {
            // Fetch draft data for selected division
            [draftPicks, draftOrder] = await Promise.all([
                getDraftPicksByDivision(divisionId),
                getDraftOrderByDivision(divisionId)
            ]);

            // Generate draft sequence if we have draft order
            if (draftOrder.length > 0 && draftState) {
                draftSequence = generateDraftSequence(draftOrder, draftState.picksPerTeam);
            }
        }

        // Filter available players
        const draftedPlayerIds = new Set(draftPicks.map(pick => pick.playerId));
        let availablePlayers = allPlayers.filter(player => !draftedPlayerIds.has(player.id.toString()));

        // Apply search and position filters
        if (search) {
            const searchResults = await searchPlayersByName(search);
            const searchIds = new Set(searchResults.map(p => p.id));
            availablePlayers = availablePlayers.filter(p => searchIds.has(p.id));
        }

        if (position) {
            const positionId = parseInt(position);
            availablePlayers = availablePlayers.filter(p => p.element_type === positionId);
        }

        // Sort by total points
        availablePlayers.sort((a, b) => b.total_points - a.total_points);

        // Determine current user and if it's their turn
        const currentUser = selectedUser || userTeams.find(team => team.divisionId === divisionId)?.userId || "";
        const isUserTurn = draftState?.isActive &&
            draftState.currentDivisionId === divisionId &&
            draftState.currentUserId === currentUser;

        return data<LoaderData>({
            draftState,
            draftPicks,
            draftOrder,
            availablePlayers: availablePlayers.slice(0, 50),
            currentUser,
            isUserTurn,
            divisions,
            userTeams: userTeams.filter(team => team.divisionId === divisionId),
            selectedDivision: divisionId,
            selectedUser: currentUser,
            draftSequence
        });

    } catch (error) {
        console.error("Draft loader error:", error);
        throw new Response("Failed to load draft data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ context })
        const actionType = formData.get("actionType");
        const divisionId = formData.get("divisionId")?.toString();
        const playerId = formData.get("playerId")?.toString();
        const userId = formData.get("userId")?.toString();

        switch (actionType) {
            case "makePick":
                if (!divisionId || !playerId || !userId) {
                    return data<ActionData>({ error: "Missing required fields for pick" });
                }

                // Get player data
                const allPlayers = await getFplPlayers();
                const player = allPlayers.find(p => p.id.toString() === playerId);

                if (!player) {
                    return data<ActionData>({ error: "Player not found" });
                }

                // Get current draft state, picks, and order
                const [draftState, existingPicks, draftOrder] = await Promise.all([
                    readDraftState(),
                    getDraftPicksByDivision(divisionId),
                    getDraftOrderByDivision(divisionId)
                ]);

                if (!draftState?.isActive) {
                    return data<ActionData>({ error: "Draft is not active" });
                }

                if (draftState.currentUserId !== userId) {
                    return data<ActionData>({ error: "Not your turn to pick" });
                }

                // Create draft pick
                const pickNumber = existingPicks.length + 1;
                const round = Math.ceil(pickNumber / draftOrder.length);

                const draftPick: DraftPickData = {
                    pickNumber,
                    round,
                    userId,
                    playerId: player.id.toString(),
                    playerName: `${player.first_name} ${player.second_name}`,
                    team: `Team ${player.team}`,
                    position: player.element_type.toString(),
                    price: player.now_cost / 10,
                    pickedAt: new Date(),
                    divisionId
                };

                await addDraftPick(draftPick);

                // Update draft state to next player using snake logic
                const nextDraftState = getNextDraftState(draftState, draftOrder);
                await updateDraftState(nextDraftState);

                return data<ActionData>({ success: true, pick: draftPick });

            default:
                return data<ActionData>({ error: "Invalid action type" });
        }

    } catch (error) {
        console.error("Draft action error:", error);
        return data<ActionData>({ error: "Failed to perform draft action" });
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
