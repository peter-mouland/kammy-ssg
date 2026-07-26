/* Location: app/_shared/components/user-selection-provider.tsx */

import type { ReactNode } from 'react';
import type { UserTeamsSheetData } from '../../../teams/types/team-types';
import { useUserSelection } from './use-user-selection';
import { UserSelectionModal } from './user-selection-modal';

interface UserSelectionProviderProps {
    children: ReactNode;
    users: UserTeamsSheetData[];
    fallbackContent?: ReactNode;
    onUserSelected?: (userId: string, user: UserTeamsSheetData) => void;
    redirectOnSelection?: boolean;
    initialSelection?: {
        selectedUserId: string | null;
        requiresSelection: boolean;
    };
}

/**
 * Provider component that wraps content and shows user selection modal when needed
 * Use this at the app level or page level to ensure user selection is handled
 */
export function UserSelectionProvider({
    children,
    users,
    fallbackContent,
    onUserSelected,
    redirectOnSelection = false,
    initialSelection,
}: UserSelectionProviderProps) {
    const { requiresSelection, showModal, setShowModal, handleUserSelect, isLoading } = useUserSelection({
        users,
        autoShowModal: true,
        onUserSelected,
        redirectOnSelection,
        initialSelection,
    });

    console.log({ requiresSelection, showModal });
    // Show loading state while determining user selection
    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    color: 'var(--color-gray-500)',
                }}
            >
                Loading...
            </div>
        );
    }

    // Show fallback content if no user selected and modal is not open
    if (requiresSelection && !showModal && fallbackContent) {
        return (
            <>
                {fallbackContent}
                <UserSelectionModal
                    users={users}
                    isOpen={showModal}
                    onUserSelect={handleUserSelect}
                    allowClose={false}
                />
            </>
        );
    }

    return (
        <>
            {children}
            <UserSelectionModal
                users={users}
                isOpen={showModal}
                onUserSelect={handleUserSelect}
                onClose={() => setShowModal(false)}
                allowClose={!requiresSelection} // Only allow close if user already selected
            />
        </>
    );
}
