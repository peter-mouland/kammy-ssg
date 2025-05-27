interface TeamDraftProps {
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
}

interface PositionSlot {
    id: string;
    position: string;
    player?: DraftPickData;
    isEmpty: boolean;
}

interface TeamFormation {
    userId: string;
    userName: string;
    positions: {
        gk: PositionSlot[];
        cb: PositionSlot[];
        fb: PositionSlot[];
        mid: PositionSlot[];
        wa: PositionSlot[];
        ca: PositionSlot[];
        sub: PositionSlot[];
    };
}


// Get position display name
const getPositionDisplayName = (position: string) => {
    const names = {
        gk: 'GK',
        cb: 'CB',
        fb: 'FB',
        mid: 'MID',
        wa: 'WA',
        ca: 'CA',
        sub: 'SUB'
    };
    return names[position as keyof typeof names] || position.toUpperCase();
};

// Get position color
const getPositionColor = (position: string) => {
    const colors = {
        gk: '#10B981',
        cb: '#3B82F6',
        fb: '#3B82F6',
        mid: '#8B5CF6',
        wa: '#F59E0B',
        ca: '#EF4444',
        sub: '#6B7280'
    };
    return colors[position as keyof typeof colors] || '#6B7280';
};

// Render position slot
const PositionSlot = (slot: PositionSlot) => (
    <div
        key={slot.id}
        style={{
            minHeight: '3rem',
            minWidth: '3rem',
            border: `2px dashed ${getPositionColor(slot.position)}`,
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: slot.isEmpty ? 'transparent' : `${getPositionColor(slot.position)}15`,
            padding: '0.5rem',
            margin: '0.25rem'
        }}
    >
        {slot.isEmpty ? (
            <span style={{
                color: getPositionColor(slot.position),
                fontSize: '0.75rem',
                fontWeight: '600',
                opacity: 0.6
            }}>
          {getPositionDisplayName(slot.position)}
        </span>
        ) : (
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.125rem'
                }}>
                    {slot.player?.playerName}
                </div>
                <div style={{
                    fontSize: '0.625rem',
                    color: '#6B7280'
                }}>
                    {getPositionDisplayName(slot.position)}
                </div>
            </div>
        )}
    </div>
);


export function TeamDraft({ draftPicks, draftOrder }: TeamDraftProps) {
    // Map FPL positions to custom positions
    const mapFplToCustomPosition = (fplPosition: string): string => {
        switch (fplPosition) {
            case '1': return 'gk';
            case '2': return Math.random() > 0.5 ? 'cb' : 'fb'; // Would need better logic
            case '3': return 'mid';
            case '4': return Math.random() > 0.5 ? 'wa' : 'ca'; // Would need better logic
            default: return 'sub';
        }
    };

    // Create formation for a specific user
    const createUserFormation = (userId: string, userName: string): TeamFormation => {
        const userPicks = draftPicks.filter(pick => pick.userId === userId);

        // Initialize empty formation
        const formation: TeamFormation = {
            userId,
            userName,
            positions: {
                gk: [{ id: `${userId}-gk-1`, position: 'gk', isEmpty: true }],
                cb: [
                    { id: `${userId}-cb-1`, position: 'cb', isEmpty: true },
                    { id: `${userId}-cb-2`, position: 'cb', isEmpty: true }
                ],
                fb: [
                    { id: `${userId}-fb-1`, position: 'fb', isEmpty: true },
                    { id: `${userId}-fb-2`, position: 'fb', isEmpty: true }
                ],
                mid: [
                    { id: `${userId}-mid-1`, position: 'mid', isEmpty: true },
                    { id: `${userId}-mid-2`, position: 'mid', isEmpty: true }
                ],
                wa: [
                    { id: `${userId}-wa-1`, position: 'wa', isEmpty: true },
                    { id: `${userId}-wa-2`, position: 'wa', isEmpty: true }
                ],
                ca: [
                    { id: `${userId}-ca-1`, position: 'ca', isEmpty: true },
                    { id: `${userId}-ca-2`, position: 'ca', isEmpty: true }
                ],
                sub: [{ id: `${userId}-sub-1`, position: 'sub', isEmpty: true }]
            }
        };

        // Place picked players into formation
        userPicks.forEach(pick => {
            const customPosition = mapFplToCustomPosition(pick.position);
            const positionSlots = formation.positions[customPosition as keyof typeof formation.positions];

            if (positionSlots) {
                // Find first empty slot in the position
                const emptySlot = positionSlots.find(slot => slot.isEmpty);
                if (emptySlot) {
                    emptySlot.player = pick;
                    emptySlot.isEmpty = false;
                } else {
                    // Position is full, put in sub
                    const subSlot = formation.positions.sub.find(slot => slot.isEmpty);
                    if (subSlot) {
                        subSlot.player = pick;
                        subSlot.isEmpty = false;
                    }
                }
            }
        });

        return formation;
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Team Formations</h2>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
                {draftOrder.map(order => {
                    const formation = createUserFormation(order.userId, order.userName);

                    return (
                        <div
                            key={order.userId}
                            style={{
                                flex: "0 1 calc(50% - 0.5rem)",
                                marginBottom: '2rem',
                                padding: '1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                backgroundColor: '#fafafa'
                            }}
                        >
                            {/* Team Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#111827'
                                }}>
                                    {formation.userName}
                                </h3>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem'
                                }}>
                  {draftPicks.filter(pick => pick.userId === order.userId).length}/12 players
                </span>
                            </div>

                            {/* Formation Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr auto',
                                gap: '0.5rem',
                                alignItems: 'start'
                            }}>
                                {/* GK Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        GK (1) SUB (1)
                                    </div>
                                    {formation.positions.gk.map(PositionSlot)}
                                    {formation.positions.sub.map(PositionSlot)}

                                </div>

                                {/* Defense Columns */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        CB (2)
                                    </div>
                                    {formation.positions.cb.map(PositionSlot)}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        FB (2)
                                    </div>
                                    {formation.positions.fb.map(PositionSlot)}
                                </div>

                                {/* Midfield Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        MID (2)
                                    </div>
                                    {formation.positions.mid.map(PositionSlot)}
                                </div>

                                {/* Attack Columns */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        WA (2)
                                    </div>
                                    {formation.positions.wa.map(PositionSlot)}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '0.5rem',
                                        textAlign: 'center'
                                    }}>
                                        CA (2)
                                    </div>
                                    {formation.positions.ca.map(PositionSlot)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
