/* Location: app/_shared/hooks/use-user-selection.hook.ts */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { UserTeamsSheetData } from '../../../teams/types/team-types';
import { clearUserSelection, getClientUserSelection, setUserSelection } from './user-selection.utils';

interface UseUserSelectionOptions {
    users: UserTeamsSheetData[];
    autoShowModal?: boolean;
    onUserSelected?: (userId: string, user: UserTeamsSheetData) => void;
    redirectOnSelection?: boolean;
    initialSelection?: {
        selectedUserId: string | null;
        selectedUser: UserTeamsSheetData | null;
        requiresSelection: boolean;
    };
}

interface UseUserSelectionReturn {
    selectedUserId: string | null;
    selectedUser: UserTeamsSheetData | null;
    requiresSelection: boolean;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    handleUserSelect: (userId: string) => void;
    clearSelection: () => void;
    isLoading: boolean;
}

export function useUserSelection({
    users,
    autoShowModal = true,
    onUserSelected,
    redirectOnSelection = false,
    initialSelection, // Add this to pass server-side selection
}: UseUserSelectionOptions): UseUserSelectionReturn {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    // Initialize state with server data if available, otherwise use client detection
    const [userSelection, setUserSelectionState] = useState<{
        selectedUserId: string | null;
        selectedUser: UserTeamsSheetData | null;
        requiresSelection: boolean;
    }>(() => {
        // If we have initial selection from server, use it immediately
        if (initialSelection) {
            return initialSelection;
        }

        // Otherwise, try to get from client (for cases without SSR data)
        if (users.length > 0 && typeof window !== 'undefined') {
            return getClientUserSelection(users);
        }

        // Fallback for server-side or no users
        return {
            selectedUserId: null,
            selectedUser: null,
            requiresSelection: true,
        };
    });

    // Only show loading if we don't have users AND don't have initial selection
    const [isLoading, setIsLoading] = useState(() => {
        return !initialSelection && users.length === 0;
    });

    // Initialize user selection on mount (only if not already initialized)
    useEffect(() => {
        if (!initialSelection && users.length > 0) {
            const selection = getClientUserSelection(users);
            setUserSelectionState(selection);

            // Auto-show modal if selection is required and autoShowModal is enabled
            if (selection.requiresSelection && autoShowModal) {
                setShowModal(true);
            }
        }

        // Set loading to false once we have users
        if (users.length > 0) {
            setIsLoading(false);
        }
    }, [users, autoShowModal, initialSelection]);

    // Auto-show modal if selection is required (for initial server data)
    useEffect(() => {
        if (initialSelection?.requiresSelection && autoShowModal && !showModal) {
            setShowModal(true);
        }
    }, [initialSelection, autoShowModal, showModal]);

    // Handle user selection
    const handleUserSelect = (userId: string) => {
        const user = users.find((u) => u.userId === userId);
        if (!user) {
            console.error('Selected user not found:', userId);
            return;
        }

        // Update local state
        setUserSelectionState({
            selectedUserId: userId,
            selectedUser: user,
            requiresSelection: false,
        });

        // Set cookie and update URL
        setUserSelection(userId, !redirectOnSelection);

        // Close modal
        setShowModal(false);

        // Call callback if provided
        onUserSelected?.(userId, user);

        // Redirect if requested (useful for pages that need full reload with new user)
        if (redirectOnSelection) {
            // Reload current page with user parameter
            const url = new URL(window.location.href);
            url.searchParams.set('userId', userId);
            window.location.href = url.toString();
        }
    };

    // Clear user selection
    const handleClearSelection = () => {
        clearUserSelection();
        setUserSelectionState({
            selectedUserId: null,
            selectedUser: null,
            requiresSelection: true,
        });

        if (autoShowModal) {
            setShowModal(true);
        }
    };

    return {
        selectedUserId: userSelection.selectedUserId,
        selectedUser: userSelection.selectedUser,
        requiresSelection: userSelection.requiresSelection,
        showModal,
        setShowModal,
        handleUserSelect,
        clearSelection: handleClearSelection,
        isLoading,
    };
}
