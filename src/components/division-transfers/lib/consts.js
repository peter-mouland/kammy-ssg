export const changeTypes = {
    TRADE: 'Trade',
    LOAN_START: 'Loan Start',
    LOAN_END: 'Loan End',
    SWAP: 'Swap',
    TRANSFER: 'Transfer',
    NEW_PLAYER: 'New Player',
};

export const verbs = {
    out: {
        [changeTypes.LOAN_START]: ' ...being loaned',
        [changeTypes.LOAN_END]: ' ...being loaned',
        [changeTypes.SWAP]: ' ...being swapped',
        [changeTypes.TRADE]: ' ...being traded',
        [changeTypes.TRANSFER]: ' ...being transferred',
        [changeTypes.NEW_PLAYER]: ' ...being taken',
    },
    in: {
        [changeTypes.LOAN_START]: ' ...being brought',
        [changeTypes.LOAN_END]: ' ...being brought',
        [changeTypes.SWAP]: ' ...being swapped',
        [changeTypes.TRADE]: ' ...being traded',
        [changeTypes.TRANSFER]: ' ...being transferred',
        [changeTypes.NEW_PLAYER]: ' ...being brought',
    },
};
