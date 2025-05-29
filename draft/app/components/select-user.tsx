
export const SelectUser = ({ users, selectedUser, handleUserChange }) => {
    return (
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
                {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.userName}
                    </option>
                ))}
            </select>
        </label>
    );
}
