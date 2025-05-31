import { type LoaderFunctionArgs } from "react-router";
import { readDraftState, getDraftPicksByDivision } from "./server/sheets/draft";
import { getDraftOrderByDivision } from "./server/sheets/draftOrder";
import type { DraftUpdateMessage, PickMadeMessage, TurnChangeMessage } from "../types";

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    const url = new URL(request.url);
    const divisionId = url.searchParams.get("division");

    if (!divisionId) {
        return new Response("Division ID is required", { status: 400 });
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            const connectionMessage = {
                type: "connection",
                data: { message: "Connected to live draft updates" },
                timestamp: new Date()
            };

            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(connectionMessage)}\n\n`)
            );

            // Set up interval to check for draft updates
            const intervalId = setInterval(async () => {
                try {

                    // Fetch current draft state and recent picks
                    const [draftState, draftPicks, draftOrder] = await Promise.all([
                        readDraftState(),
                        getDraftPicksByDivision(divisionId),
                        getDraftOrderByDivision(divisionId)
                    ]);

                    if (!draftState?.isActive || draftState.currentDivisionId !== divisionId) {
                        return; // No active draft for this division
                    }

                    // Send draft update message
                    const draftUpdateMessage: DraftUpdateMessage = {
                        type: "draft-update",
                        data: {
                            currentPick: draftState.currentPick,
                            currentUserId: draftState.currentUserId,
                            pickDeadline: new Date(Date.now() + 120000), // 2 minutes from now
                            recentPicks: draftPicks.slice(-5) // Last 5 picks
                        },
                        timestamp: new Date()
                    };

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(draftUpdateMessage)}\n\n`)
                    );

                    // Check if there's a new pick since last update
                    // This would require storing state between calls in a real implementation
                    // For now, we'll send the most recent pick if it's very recent
                    const recentPick = draftPicks[draftPicks.length - 1];
                    if (recentPick && new Date().getTime() - new Date(recentPick.pickedAt).getTime() < 10000) {
                        const pickMadeMessage: PickMadeMessage = {
                            type: "pick-made",
                            data: recentPick,
                            timestamp: new Date()
                        };

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(pickMadeMessage)}\n\n`)
                        );
                    }

                    // Send turn change message if needed
                    const currentUser = draftOrder.find(order => order.userId === draftState.currentUserId);
                    if (currentUser) {
                        const turnChangeMessage: TurnChangeMessage = {
                            type: "turn-change",
                            data: {
                                newUserId: draftState.currentUserId,
                                pickNumber: draftState.currentPick,
                                pickDeadline: new Date(Date.now() + 120000)
                            },
                            timestamp: new Date()
                        };

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(turnChangeMessage)}\n\n`)
                        );
                    }

                } catch (error) {
                    console.error("SSE update error:", error);

                    const errorMessage = {
                        type: "error",
                        data: { message: "Failed to fetch draft updates" },
                        timestamp: new Date()
                    };

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
                    );
                }
            }, 5000); // Update every 5 seconds

            // Clean up interval when client disconnects
            const cleanupIntervals = () => {
                clearInterval(intervalId);
                controller.close();
            };

            // Handle client disconnect
            request.signal.addEventListener("abort", cleanupIntervals);

            // Keep connection alive with periodic pings
            const pingInterval = setInterval(() => {
                try {
                    const pingMessage = {
                        type: "ping",
                        data: { timestamp: new Date() },
                        timestamp: new Date()
                    };

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(pingMessage)}\n\n`)
                    );
                } catch (error) {
                    // Client disconnected
                    cleanupIntervals();
                }
            }, 30000); // Ping every 30 seconds

            // Clean up both intervals when connection closes
            const cleanupAll = () => {
                clearInterval(intervalId);
                clearInterval(pingInterval);
                controller.close();
            };

            // Update the abort listener to use the comprehensive cleanup
            request.signal.removeEventListener("abort", cleanupIntervals);
            request.signal.addEventListener("abort", cleanupAll);
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    });
}
