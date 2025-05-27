import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData, Form, useFetcher, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { readDraftState, addDraftPick, getDraftPicksByDivision, updateDraftState } from "../lib/sheets/draft";
import { getDraftOrderByDivision } from "../lib/sheets/draftOrder";
import { readDivisions } from "../lib/sheets/divisions";
import { readUserTeams } from "../lib/sheets/userTeams";
import { getFplPlayers, searchPlayersByName } from "../lib/fpl/api";
import { getNextDraftState, generateDraftSequence } from "../lib/draft/helpers";
import type { DraftStateData, DraftPickData, DraftOrderData, FplPlayerData, DivisionData, UserTeamData } from "../types";
import { DraftBoard } from '../components/draft-board';
import { DraftOrder } from '../components/draft-order';
import { TeamDraft } from '../components/draft-team';

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
        // const selectedDivision = url.searchParams.get("division") || "";
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
                draftSequence = generateDraftSequence(draftOrder, draftState.totalRounds);
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

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await request.formData();
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
    const actionData = useActionData<typeof action>();
    const fetcher = useFetcher();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPosition, setSelectedPosition] = useState("");
    const [timeRemaining, setTimeRemaining] = useState(0);

    const handleUserChange = (userId: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("user", userId);
            return newParams;
        });
    };

    // Handle search/filter changes
    const handleSearch = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (searchTerm) {
                newParams.set("search", searchTerm);
            } else {
                newParams.delete("search");
            }
            if (selectedPosition) {
                newParams.set("position", selectedPosition);
            } else {
                newParams.delete("position");
            }
            return newParams;
        });
    };

    // Mock timer for pick deadline
    useEffect(() => {
        if (isUserTurn && draftState?.isActive) {
            setTimeRemaining(120); // 2 minutes per pick
            const timer = setInterval(() => {
                setTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isUserTurn, draftState?.isActive, draftPicks.length]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPositionName = (elementType: number) => {
        const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
        return positions[elementType as keyof typeof positions] || 'Unknown';
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
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {draftState?.isActive ? "🟢 Live " + divisions.find(d => d.id === draftState?.currentDivisionId)?.label + " Draft Room" : "⚪️ Draft Room"}
                </h1>
                <label htmlFor="user-select" style={{ display: 'inline', fontWeight: '500' }}>
                    <span style={{ margin: "0 1rem 0 0" }}>Select User:</span>
                    <select
                        id="user-select"
                        value={selectedUser || ""}
                        onChange={(e) => handleUserChange(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="">Choose a user...</option>
                        {userTeams.map((team) => (
                            <option key={team.userId} value={team.userId}>
                                {team.userName} ({team.teamName})
                            </option>
                        ))}
                    </select>
                </label>
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

                                {isUserTurn && timeRemaining > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.15rem' }}>
                                        <span style={{
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            color: timeRemaining < 30 ? '#ef4444' : '#f59e0b'
                                        }}>
                                            ⏰ {formatTime(timeRemaining)}
                                        </span>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Available Players */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Available Players</h2>

                                {/* Search and Filter */}
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="Search players..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{
                                            flex: 1,
                                            minWidth: '200px',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem'
                                        }}
                                    />
                                    <select
                                        value={selectedPosition}
                                        onChange={(e) => setSelectedPosition(e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="">All Positions</option>
                                        <option value="1">Goalkeepers</option>
                                        <option value="2">Defenders</option>
                                        <option value="3">Midfielders</option>
                                        <option value="4">Forwards</option>
                                    </select>
                                    <button onClick={handleSearch} className="btn btn-secondary">
                                        🔍 Search
                                    </button>
                                </div>
                            </div>

                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {availablePlayers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                                        <p>No players found matching your criteria.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {availablePlayers.map((player) => (
                                            <div
                                                key={player.id}
                                                style={{
                                                    padding: '1rem',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: 'white',
                                                    cursor: isUserTurn ? 'pointer' : 'default',
                                                    opacity: isUserTurn ? 1 : 0.7,
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => isUserTurn && handleMakePick(player.id.toString())}
                                                onMouseEnter={(e) => isUserTurn && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                                                onMouseLeave={(e) => isUserTurn && (e.currentTarget.style.backgroundColor = 'white')}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', marginBottom: '0.15rem' }}>
                                                            {player.first_name} {player.second_name}
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                            {getPositionName(player.element_type)} • Team {player.team}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '600', color: '#059669' }}>
                                                            £{(player.now_cost / 10).toFixed(1)}m
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                            {player.total_points} pts
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div>
                            {/* Draft Order */}
                            <DraftOrder draftOrder={draftOrder} draftPicks={draftPicks} draftSequence={draftSequence} draftState={draftState} />

                            {/* Draft Board */}
                            <DraftBoard draftPicks={draftPicks} />
                        </div>
                    </div>
            <TeamDraft draftPicks={draftPicks} draftOrder={draftOrder} />
        </div>
    );
}
