import { graphql, useStaticQuery } from 'gatsby';

const useMeta = () => {
    const {
        siteBuildMetadata: { built, buildTime },
    } = useStaticQuery(graphql`
        query meta {
            siteBuildMetadata {
                built: buildTime(fromNow: true)
                buildTime(formatString: "MMM do, HH:mm:ss")
            }
        }
    `);
    return { built, buildTime };
};

export default useMeta;
