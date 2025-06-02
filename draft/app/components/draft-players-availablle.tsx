import { useSearchParams } from 'react-router';
import { useState } from 'react';
import { getPositionDisplayName } from '../lib/points';

export const DraftPlayersAvailable = ({ onSelectPlayer, availablePlayers, isUserTurn }) => {

    const [, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPosition, setSelectedPosition] = useState("");

    // Handle search/filter changes
    const handleSearch = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (searchTerm) {
                newParams.set("search", searchTerm);
            } else {
                newParams.delete("search");
            }
            if (selectedPosition) {
                newParams.set("position", selectedPosition);
            } else {
                newParams.delete("position");
            }
            return newParams;
        });
    };
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Available Players</h2>

                {/* Search and Filter */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                        }}
                    />
                    <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="">All Positions</option>
                        <option value="1">Goalkeepers (GK)</option>
                        <option value="2">Fallbacks (FB)</option>
                        <option value="2">Widebacks (WB)</option>
                        <option value="3">Midfielders (MID)</option>
                        <option value="4">Wide Attack (WA)</option>
                        <option value="4">Centre Attack (CA)</option>
                    </select>
                    <button onClick={handleSearch} className="btn btn-secondary">
                        🔍 Search
                    </button>
                </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {availablePlayers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                        <p>No players found matching your criteria.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {availablePlayers.map((player) => (
                            <div
                                key={player.id}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderBottom: '1px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    cursor: isUserTurn ? 'pointer' : 'default',
                                    opacity: isUserTurn ? 1 : 0.7,
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => isUserTurn && onSelectPlayer(player.id.toString())}
                                onMouseEnter={(e) => isUserTurn && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                                onMouseLeave={(e) => isUserTurn && (e.currentTarget.style.backgroundColor = 'white')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '0.15rem' }}>
                                            {player.first_name} {player.second_name}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {player.draft?.position} • Team {player.team}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '600', color: '#059669' }}>
                                            £{(player.now_cost / 10).toFixed(1)}m
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {player.total_points} pts
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
