// app/routes/api.draft.live.ts - Enhanced SSE endpoint
import { type LoaderFunctionArgs } from "react-router";

interface DraftEvent {
    type: 'pick-made' | 'turn-change' | 'draft-started' | 'draft-ended' | 'connection' | 'heartbeat';
    data: any;
    timestamp: string;
    divisionId: string;
}

// In-memory store for tracking active connections and last events
const activeConnections = new Map<string, {
    controller: ReadableStreamDefaultController;
    divisionId: string;
    userId?: string;
    lastEventId: number;
}>();

const lastEvents = new Map<string, {
    eventId: number;
    event: DraftEvent;
    timestamp: number;
}>();

let globalEventId = 0;

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    const url = new URL(request.url);
    const divisionId = url.searchParams.get("division");
    const userId = url.searchParams.get("user");
    const lastEventId = parseInt(url.searchParams.get("lastEventId") || "0");

    if (!divisionId) {
        return new Response("Division ID is required", { status: 400 });
    }

    const connectionId = `${divisionId}-${userId || 'anonymous'}-${Date.now()}`;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Store connection
            activeConnections.set(connectionId, {
                controller,
                divisionId,
                userId,
                lastEventId
            });

            console.log(`📡 SSE connection opened: ${connectionId} for division ${divisionId}`);

            // Send missed events if client reconnected
            if (lastEventId > 0) {
                const missedEvents = Array.from(lastEvents.values())
                    .filter(e => e.eventId > lastEventId && e.event.divisionId === divisionId)
                    .sort((a, b) => a.eventId - b.eventId);

                missedEvents.forEach(({ eventId, event }) => {
                    controller.enqueue(
                        encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(event)}\n\n`)
                    );
                });
            }

            // Send connection confirmation
            const connectionEvent: DraftEvent = {
                type: "connection",
                data: {
                    message: "Connected to live draft updates",
                    connectionId,
                    divisionId
                },
                timestamp: new Date().toISOString(),
                divisionId
            };

            const eventId = ++globalEventId;
            controller.enqueue(
                encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(connectionEvent)}\n\n`)
            );

            // Send current draft state immediately
            sendCurrentDraftState(divisionId, controller, encoder);

            // Cleanup on disconnect
            const cleanup = () => {
                activeConnections.delete(connectionId);
                console.log(`📡 SSE connection closed: ${connectionId}`);
            };

            request.signal.addEventListener("abort", cleanup);

            // Heartbeat to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    const heartbeatEvent: DraftEvent = {
                        type: "heartbeat",
                        data: { timestamp: new Date().toISOString() },
                        timestamp: new Date().toISOString(),
                        divisionId
                    };

                    const eventId = ++globalEventId;
                    controller.enqueue(
                        encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(heartbeatEvent)}\n\n`)
                    );
                } catch (error) {
                    // Connection closed
                    cleanup();
                    clearInterval(heartbeatInterval);
                }
            }, 30000); // Every 30 seconds

            // Update cleanup to include heartbeat
            const cleanupAll = () => {
                clearInterval(heartbeatInterval);
                cleanup();
                try {
                    controller.close();
                } catch (e) {
                    // Controller already closed
                }
            };

            request.signal.removeEventListener("abort", cleanup);
            request.signal.addEventListener("abort", cleanupAll);
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no", // Disable proxy buffering
        }
    });
}

// Helper function to send current draft state
async function sendCurrentDraftState(
    divisionId: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
) {
    try {
        const { readDraftState, getDraftPicksByDivision } = await import("./server/sheets/draft");
        const { getDraftOrderByDivision } = await import("./server/sheets/draft-order");

        const [draftState, draftPicks, draftOrder] = await Promise.all([
            readDraftState(),
            getDraftPicksByDivision(divisionId),
            getDraftOrderByDivision(divisionId)
        ]);

        const stateEvent: DraftEvent = {
            type: "turn-change",
            data: {
                currentPick: draftState?.currentPick || 1,
                currentUserId: draftState?.currentUserId || '',
                isActive: draftState?.isActive || false,
                recentPicks: draftPicks.slice(-3),
                pickCount: draftPicks.length
            },
            timestamp: new Date().toISOString(),
            divisionId
        };

        const eventId = ++globalEventId;
        controller.enqueue(
            encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(stateEvent)}\n\n`)
        );

    } catch (error) {
        console.error("Error sending current draft state:", error);
    }
}

// Export function to broadcast events to all connected clients
export function broadcastDraftEvent(event: Omit<DraftEvent, 'timestamp'>) {
    const fullEvent: DraftEvent = {
        ...event,
        timestamp: new Date().toISOString()
    };

    const eventId = ++globalEventId;
    const encoder = new TextEncoder();

    // Store event for reconnection scenarios
    lastEvents.set(`${event.divisionId}-${eventId}`, {
        eventId,
        event: fullEvent,
        timestamp: Date.now()
    });

    // Clean up old events (keep last 50 per division)
    const divisionEvents = Array.from(lastEvents.entries())
        .filter(([key]) => key.startsWith(`${event.divisionId}-`))
        .sort((a, b) => b[1].eventId - a[1].eventId);

    if (divisionEvents.length > 50) {
        divisionEvents.slice(50).forEach(([key]) => lastEvents.delete(key));
    }

    // Broadcast to all connections for this division
    const connections = Array.from(activeConnections.entries())
        .filter(([_, conn]) => conn.divisionId === event.divisionId);

    console.log(`📡 Broadcasting ${event.type} to ${connections.length} connections for division ${event.divisionId}`);

    connections.forEach(([connectionId, connection]) => {
        try {
            connection.controller.enqueue(
                encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(fullEvent)}\n\n`)
            );
        } catch (error) {
            console.error(`Failed to send to connection ${connectionId}:`, error);
            // Remove dead connection
            activeConnections.delete(connectionId);
        }
    });
}

// Helper to get connection count (for debugging)
export function getConnectionStats() {
    const stats = new Map<string, number>();
    activeConnections.forEach(conn => {
        const count = stats.get(conn.divisionId) || 0;
        stats.set(conn.divisionId, count + 1);
    });
    return Object.fromEntries(stats);
}
