interface DraftOrderProps {
    draftOrder: DraftOrderData[];
    draftPicks: DraftPickData[];
    draftState: DraftStateData | null;
    draftSequence: Array<{
        pickNumber: number;
        round: number;
        userId: string;
        userName: string;
        position: number;
    }>;
}

export function DraftOrder({ draftOrder, draftPicks, draftState, draftSequence }: DraftOrderProps) {
    // Get next picker from draft sequence
    const getNextPicker = () => {
        if (!draftState?.isActive || draftSequence.length === 0) return null;

        const currentPickIndex = draftSequence.findIndex(pick => pick.pickNumber === draftState.currentPick);
        return currentPickIndex !== -1 && currentPickIndex < draftSequence.length - 1
            ? draftSequence[currentPickIndex + 1]
            : null;
    };

    const nextPicker = getNextPicker();

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Draft Order</h2>
            </div>

            <div>
                {draftOrder.map((order, index) => {
                    const isCurrentPicker = order.userId === draftState?.currentUserId;
                    const isNextPicker = nextPicker?.userId === order.userId;
                    const pickCount = draftPicks.filter(pick => pick.userId === order.userId).length;
                    const isLastItem = index === draftOrder.length - 1;

                    return (
                        <div
                            key={order.userId}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderBottom: isLastItem ? 'none' : '1px solid #f3f4f6',
                                backgroundColor: isCurrentPicker ? '#f0fdf4' : 'white',
                                border: isCurrentPicker ? '1px solid #10b981' :
                                    isNextPicker ? '1px solid #f59e0b' : 'none',
                                marginBottom: isCurrentPicker || isNextPicker ? '0.25rem' : '0',
                                borderRadius: isCurrentPicker || isNextPicker ? '0.375rem' : '0'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                {/* Left: Position + Name + Status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      minWidth: '1.5rem',
                      color: '#6b7280'
                  }}>
                    #{order.position}
                  </span>

                                    <span style={{
                                        fontWeight: isCurrentPicker || isNextPicker ? '600' : '500',
                                        fontSize: '0.875rem',
                                        color: isCurrentPicker ? '#059669' :
                                            isNextPicker ? '#f59e0b' : '#374151'
                                    }}>
                    {order.userName}
                  </span>

                                    {/* Status Icons */}
                                    {isCurrentPicker && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#059669',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                      ⏰ on clock
                    </span>
                                    )}

                                    {isNextPicker && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#f59e0b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                      ⏭️ next up
                    </span>
                                    )}
                                </div>

                                {/* Right: Pick Count */}
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    fontWeight: '500'
                                }}>
                  {pickCount} pick{pickCount !== 1 ? 's' : ''}
                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
