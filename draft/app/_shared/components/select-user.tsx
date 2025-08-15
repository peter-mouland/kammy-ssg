/* Location: app/_shared/components/select-user.tsx */

import type { UserTeamsSheetData } from '../../teams/types/team-types';
import { setUserSelection } from '../features/user-selection/user-selection.utils';
import styles from './select-user.module.css';

interface User {
    userId: string;
    userName: string;
}

interface SelectUserProps {
    users: User[] | UserTeamsSheetData[];
    selectedUser: string | null;
    handleUserChange?: (userId: string) => void;
    showCookieIndicator?: boolean;
}

export function SelectUser({ users, selectedUser, handleUserChange }: SelectUserProps) {
    const handleChange = (userId: string) => {
        if (userId) {
            setUserSelection(userId, true);
        }
        if (handleUserChange) handleUserChange(userId);
    };

    return (
        <div className={styles.selectContainer}>
            <label htmlFor="user-select" className={styles.selectLabel}>
                Select User:
            </label>
            <select
                id="user-select"
                value={selectedUser || ''}
                onChange={(e) => handleChange(e.target.value)}
                className={styles.selectInput}
            >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.userName}
                    </option>
                ))}
            </select>
        </div>
    );
}
