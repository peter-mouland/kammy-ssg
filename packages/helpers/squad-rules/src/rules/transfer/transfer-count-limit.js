import { changeTypes, MAX_TRANSFERS } from '../../consts';

export const transferCountLimit = (changeState, { transfers }) => {
    const managerTransfers = transfers.filter(
        (transfer) => transfer.managerId === changeState.managerId && transfer.type === changeTypes.TRANSFER,
    );
    return {
        error: managerTransfers.length >= MAX_TRANSFERS && changeState.type === changeTypes.TRANSFER,
        message: `
        It appears you have already made two <strong>transfers</strong> during this game week,
        so this move may exceed your limit
    `,
    };
};
