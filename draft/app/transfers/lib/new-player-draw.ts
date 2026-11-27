// app/transfers/lib/new-player-draw.ts

import type { ManagerId } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { ProcessedTransfer, TransferType } from '../types/transfer-types';

/**
 * The type a request should have for this player in (rules 3.7–3.9): a new player goes to a
 * draw, so a plain transfer becomes a New Player Request, and back again for anyone else.
 * Any other type the manager chose is left alone, and the validator speaks up if it's wrong.
 */
export function typeForPlayerIn(playerIn: EnhancedPlayerData | null, transferType: TransferType): TransferType {
    const isNew = playerIn?.draft?.isNew === true;

    if (isNew && transferType === 'TRANSFER') return 'NEW_PLAYER';
    if (!isNew && transferType === 'NEW_PLAYER') return 'TRANSFER';
    return transferType;
}

/** How many other managers have a pending request in the draw for this player. */
export function countOtherDrawRequests(
    transfers: ProcessedTransfer[],
    playerCode: number,
    managerId: ManagerId,
): number {
    const requesters = transfers
        .filter(
            (transfer) =>
                transfer.transferType === 'NEW_PLAYER' &&
                transfer.status === 'PENDING' &&
                transfer.playerIn?.code === playerCode &&
                transfer.managerId !== managerId,
        )
        .map((transfer) => transfer.managerId);

    return new Set(requesters).size;
}
