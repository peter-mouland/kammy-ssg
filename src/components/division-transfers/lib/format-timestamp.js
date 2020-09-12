/* eslint-disable react/no-danger */
import format from 'date-fns/format';

const formatTimestamp = (ts) => {
    try {
        return format(ts, 'MMM d, HH:mm:ss');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(ts);
        return 'unknown date';
    }
};

export default formatTimestamp;
