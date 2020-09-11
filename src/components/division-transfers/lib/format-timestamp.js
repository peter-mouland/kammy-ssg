/* eslint-disable react/no-danger */
import format from 'date-fns/format';
import { getUtcDate, getGmtDate } from '@kammy/helpers.get-gmt-date';

const formatTimestamp = (ts, { fromGMT = false, fromUTC = false } = {}) => {
    try {
        const date = fromGMT || fromUTC ? new Date(fromGMT ? getUtcDate(ts) : getGmtDate(ts)) : new Date(ts);
        return format(date, 'MMM d, HH:mm:ss');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(ts, getUtcDate(ts), getUtcDate(ts));
        return 'unknown date';
    }
};

export default formatTimestamp;
