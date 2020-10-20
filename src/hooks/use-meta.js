import { graphql, useStaticQuery } from 'gatsby';
import format from 'date-fns/format';
import fromNow from 'fromnow';

const formatTimestamp = (ts, fmt = 'MMM do, HH:mm:ss') => {
    try {
        return format(ts, fmt);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(ts);
        return 'unknown date';
    }
};

const useMeta = () => {
    const {
        siteBuildMetadata: { buildTime, formattedTime, ...rest },
    } = useStaticQuery(graphql`
        query meta {
            siteBuildMetadata {
                built: buildTime(fromNow: true)
                buildTime
                formattedTime: buildTime(formatString: "MMM do, HH:mm:ss")
            }
        }
    `);
    const buildDate = new Date(buildTime);
    return {
        ...rest,
        buildTime: buildDate,
        formattedTime: formatTimestamp(buildDate),
        getFromNow: () => fromNow(buildDate),
    };
};

export default useMeta;
