// components/draft-sse-handler/draft-sse-handler.tsx
import { useEffect, useRef } from 'react';
import { useDraftSSE } from '../lib/use-draft-sse';
import { useToast } from '../../_shared/components/toast-manager';

interface DraftSSEHandlerProps {
    divisionId: string;
    currentUserId: string;
    enabled: boolean;
    children: (sseProps: {
        connectionState: string;
        isConnected: boolean;
        hasError: boolean;
        reconnect: () => void;
    }) => React.ReactNode;
}

export function DraftSSEHandler({
                                    divisionId,
                                    currentUserId,
                                    enabled,
                                    children
                                }: DraftSSEHandlerProps) {
    const { showToast } = useToast();
    const lastNotificationRef = useRef<string>('');

    // Stable callback functions to prevent SSE hook rerenders
    const handlePickMade = (data: any) => {
        if (data.userId !== currentUserId) {
            const notificationKey = `pick-${data.userId}-${data.playerId}`;

            // Prevent duplicate notifications
            if (lastNotificationRef.current !== notificationKey) {
                lastNotificationRef.current = notificationKey;

                showToast({
                    message: `${data.userName} picked ${data.playerName}`,
                    type: 'info',
                    duration: 4000
                });
            }
        }
    };

    const handleTurnChange = (data: any) => {
        if (data.currentUserId === currentUserId) {
            const notificationKey = `turn-${data.currentUserId}-${data.currentPick}`;

            // Prevent duplicate turn notifications
            if (lastNotificationRef.current !== notificationKey) {
                lastNotificationRef.current = notificationKey;

                showToast({
                    message: "It's your turn to pick!",
                    type: 'info',
                    duration: 6000 // Longer duration for turn notifications
                });
            }
        }
    };

    const handleDraftEnded = (data: any) => {
        showToast({
            message: data.message || "Draft completed!",
            type: 'success',
            duration: 8000 // Longer duration for important notifications
        });

        // Clear the last notification ref when draft ends
        lastNotificationRef.current = '';
    };

    // SSE connection with stable callbacks
    const sseProps = useDraftSSE({
        divisionId,
        userId: currentUserId,
        enabled,
        onPickMade: handlePickMade,
        onTurnChange: handleTurnChange,
        onDraftEnded: handleDraftEnded
    });

    // Clear notification tracking when division changes
    useEffect(() => {
        lastNotificationRef.current = '';
    }, [divisionId]);

    return <>{children(sseProps)}</>;
}

// Wrapper component for the entire draft with SSE
interface DraftWithSSEProps {
    divisionId: string;
    currentUserId: string;
    isDraftActive: boolean;
    children: (sseProps: {
        connectionState: string;
        isConnected: boolean;
        hasError: boolean;
        reconnect: () => void;
    }) => React.ReactNode;
}

export function DraftWithSSE({
                                 divisionId,
                                 currentUserId,
                                 isDraftActive,
                                 children
                             }: DraftWithSSEProps) {
    return (
        <DraftSSEHandler
            divisionId={divisionId}
            currentUserId={currentUserId}
            enabled={isDraftActive}
        >
            {children}
        </DraftSSEHandler>
    );
}
