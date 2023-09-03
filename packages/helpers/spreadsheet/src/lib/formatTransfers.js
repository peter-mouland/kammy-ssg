const formatTransfers = (data = [], division) => {
    try {
        const completeRows = data.filter((item) => item.Status);
        if (completeRows.length !== data.length) {
            // eslint-disable-next-line no-console
            console.log(`processing ${completeRows.length} rows out of ${data.length}`);
        }
        return completeRows.map(({ Comment = '', Status, Timestamp, Manager, ...item }, i) => ({
            division,
            comment: Comment.trim(),
            status: Status.trim() || '',
            isValid: Status === 'Y',
            isPending: Status === 'TBC',
            isFailed: Status === 'E',
            timestamp: new Date(Timestamp),
            date: Timestamp,
            manager: Manager?.trim(),
            transferIn: item['Transfer In'],
            codeIn: item['Code In'],
            transferOut: item['Transfer Out'],
            codeOut: item['Code Out'],
            type: item['Transfer Type'],
        }));
    } catch (e) {
        console.error('formatTransfers error');
        console.error(e);
        return [];
    }
};

module.exports = formatTransfers;
