export const SelectDivision = ({ divisions, selectedDivision, handleDivisionChange }) => {
    return (
        <label htmlFor="division-select" style={{ fontWeight: '500' }}>
            <span style={{ margin: "0 1rem 0 0" }}>Select Division:</span>

            <select
                id="division-select"
                value={selectedDivision || "all"}
                onChange={(e) => handleDivisionChange(e.target.value)}
                style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white'
                }}
            >
                <option value="all">All Divisions</option>
                {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                        {division.label}
                    </option>
                ))}
            </select>
        </label>
    )
}
