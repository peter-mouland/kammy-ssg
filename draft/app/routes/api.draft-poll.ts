// app/routes/api.draft.poll.ts
import { type LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

interface DraftPollResponse {
    hasUpdates: boolean;
    newPicksCount: number;
    currentPick: number;
    currentUserId: string;
    isDraftActive: boolean;
    lastUpdate: string;
}

// Minimal cache to track last known state
const pollCache = new Map<string, {
    pickCount: number;
    currentPick: number;
    lastChecked: number;
}>();

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    const url = new URL(request.url);
    const divisionId = url.searchParams.get("division");
    const lastKnownPickCount = parseInt(url.searchParams.get("pickCount") || "0");

    if (!divisionId) {
        return data<DraftPollResponse>({
            hasUpdates: false,
            newPicksCount: 0,
            currentPick: 1,
            currentUserId: "",
            isDraftActive: false,
            lastUpdate: new Date().toISOString()
        }, { status: 400 });
    }

    try {
        // Import only the minimal functions we need
        const { readDraftState } = await import("./server/sheets/draft");
        const { getQuickPickCount } = await import("./server/sheets/draft-quick");

        // Check cache first to avoid unnecessary reads
        const cacheKey = divisionId;
        const cached = pollCache.get(cacheKey);
        const now = Date.now();

        // If we checked very recently (less than 2 seconds), return cached result
        if (cached && (now - cached.lastChecked) < 2000) {
            return data<DraftPollResponse>({
                hasUpdates: cached.pickCount > lastKnownPickCount,
                newPicksCount: Math.max(0, cached.pickCount - lastKnownPickCount),
                currentPick: cached.currentPick,
                currentUserId: "",
                isDraftActive: true,
                lastUpdate: new Date().toISOString()
            });
        }

        // Minimal reads: only draft state and pick count
        const [draftState, currentPickCount] = await Promise.all([
            readDraftState(), // 1 sheet read
            getQuickPickCount(divisionId) // 1 sheet read (optimized)
        ]);

        const isDraftActive = draftState?.isActive && draftState.currentDivisionId === divisionId;
        const hasUpdates = currentPickCount > lastKnownPickCount;

        // Update cache
        pollCache.set(cacheKey, {
            pickCount: currentPickCount,
            currentPick: draftState?.currentPick || 1,
            lastChecked: now
        });

        // Clean up old cache entries (older than 5 minutes)
        for (const [key, value] of pollCache.entries()) {
            if (now - value.lastChecked > 300000) {
                pollCache.delete(key);
            }
        }

        return data<DraftPollResponse>({
            hasUpdates,
            newPicksCount: Math.max(0, currentPickCount - lastKnownPickCount),
            currentPick: draftState?.currentPick || 1,
            currentUserId: draftState?.currentUserId || "",
            isDraftActive,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error("Draft poll error:", error);

        // Return safe defaults on error
        return data<DraftPollResponse>({
            hasUpdates: false,
            newPicksCount: 0,
            currentPick: 1,
            currentUserId: "",
            isDraftActive: false,
            lastUpdate: new Date().toISOString()
        }, { status: 500 });
    }
}
