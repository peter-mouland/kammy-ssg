/* eslint-disable react/no-danger */
import format from 'date-fns/format';

const formatTimestamp = (ts, fmt = 'MMM d, HH:mm:ss') => {
    try {
        return format(ts, fmt);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(ts);
        return 'unknown date';
    }
};

export default formatTimestamp;
