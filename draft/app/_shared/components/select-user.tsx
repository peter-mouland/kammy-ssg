import styles from './select-user.module.css';

interface User {
    userId: string;
    userName: string;
}

interface SelectUserProps {
    users: User[];
    selectedUser: string | null;
    handleUserChange: (userId: string) => void;
}

export function SelectUser({
                               users,
                               selectedUser,
                               handleUserChange
                           }: SelectUserProps) {
    return (
        <label htmlFor="user-select" className={styles.selectContainer}>
            <span className={styles.selectLabel}>Select User:</span>
            <select
                id="user-select"
                value={selectedUser || ""}
                onChange={(e) => handleUserChange(e.target.value)}
                className={styles.selectInput}
            >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.userName}
                    </option>
                ))}
            </select>
        </label>
    );
}
