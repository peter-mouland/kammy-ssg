
// Helper function to determine if a stat is relevant for a position
export const isStatRelevant = (stat: string, position: string): boolean => {
    switch (stat) {
        case 'clean_sheets':
            return ['GK', 'CB', 'FB', 'MID'].includes(position);
        case 'goals_conceded':
            return ['GK', 'CB', 'FB'].includes(position);
        case 'penalties_saved':
            return position === 'GK';
        case 'saves':
            return position === 'GK';
        case 'bonus':
            return ['CB', 'MID'].includes(position);
        default:
            return true; // Goals, assists, minutes, cards are relevant for all
    }
};
