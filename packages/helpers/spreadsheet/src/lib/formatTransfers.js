const formatTransfers = (data = [], divisionId) => {
    try {
        const completeRows = data.filter((item) => item.Status);
        if (completeRows.length !== data.length) {
            // eslint-disable-next-line no-console
            console.log(`processing ${completeRows.length} rows out of ${data.length}`);
        }
        // used by server and client-side fetching, so should satin in this shared package
        return completeRows.map((transfer) => ({
            comment: transfer.Comment?.trim(),
            status: transfer.Status?.trim() || '',
            isValid: transfer.Status === 'Y',
            isPending: transfer.Status === 'TBC',
            isFailed: transfer.Status === 'E',
            timestamp: new Date(transfer.Timestamp),
            managerId: transfer.Manager?.trim().toLowerCase().replace(/ /g, '-'),
            codeIn: parseInt(transfer['Code In'], 10),
            codeOut: parseInt(transfer['Code Out'], 10),
            type: transfer['Transfer Type'],
            divisionId,
        }));
    } catch (e) {
        console.error('formatTransfers error');
        console.error(e);
        return [];
    }
};

module.exports = formatTransfers;
