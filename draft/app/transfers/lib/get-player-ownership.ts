// Get player ownership information (would need to be passed from parent or fetched)
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { OwnedPlayersByCode, PlayerOwnership } from '../types/transfer-form-types';

export const getPlayerOwnership = (
    player: EnhancedPlayerData,
    ownedPlayersByCode: OwnedPlayersByCode,
): PlayerOwnership => {
    return {
        isOwned: !!ownedPlayersByCode[player.code],
        ownerId: ownedPlayersByCode[player.code]?.managerId,
        ownerName: ownedPlayersByCode[player.code]?.managerId,
    };
};
