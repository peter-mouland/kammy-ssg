import { graphql, useStaticQuery } from 'gatsby';
import fromNow from 'fromnow';

const useMeta = () => {
    const {
        siteBuildMetadata: { buildTime, formattedTime },
    } = useStaticQuery(graphql`
        query meta {
            siteBuildMetadata {
                buildTime
                formattedTime: buildTime(formatString: "MMM do, HH:mm:ss")
            }
        }
    `);
    const buildDate = new Date(buildTime);
    return {
        formattedTime,
        getFromNow: () => fromNow(buildDate),
    };
};

export default useMeta;
