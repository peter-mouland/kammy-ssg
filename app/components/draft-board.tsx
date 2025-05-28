interface DraftBoardProps {
    draftPicks: DraftPickData[];
}

export function DraftBoard({ draftPicks }: DraftBoardProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Draft Board</h2>
                <p style={{ color: '#6b7280' }}>
                    {draftPicks.length} picks made
                </p>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {draftPicks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                        <p>No picks made yet. Draft will begin soon!</p>
                    </div>
                ) : (
                    <div>
                        {draftPicks
                            .sort((a, b) => b.pickNumber - a.pickNumber)
                            .slice(0, 20)
                            .map((pick, index) => {
                                const isLastItem = index === draftPicks.slice(0, 20).length - 1;

                                return (
                                    <div
                                        key={pick.pickNumber}
                                        style={{
                                            padding: '0.5rem',
                                            borderBottom: isLastItem ? 'none' : '1px solid #f3f4f6',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        {/* Top Line: Pick # + Player Name + Manager */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.25rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#3b82f6',
                            minWidth: '2rem'
                        }}>
                          #{pick.pickNumber}
                        </span>
                                                <span style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.875rem',
                                                    color: '#111827'
                                                }}>
                          {pick.playerName}
                        </span>
                                            </div>

                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#374151',
                                                fontWeight: '500'
                                            }}>
                        {pick.userId}
                      </span>
                                        </div>

                                        {/* Bottom Line: Position + Team + Price */}
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <span>{getPositionName(parseInt(pick.position))}</span>
                                            <span>•</span>
                                            <span>{pick.team}</span>
                                            <span>•</span>
                                            <span>£{pick.price}m</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function (should be imported from your utils)
function getPositionName(elementType: number) {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType as keyof typeof positions] || 'Unknown';
}
