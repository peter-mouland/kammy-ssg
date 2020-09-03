import { graphql, useStaticQuery } from 'gatsby';

const usePlayers = () => {
    const {
        allAdminPlayersList: { nodes: players },
    } = useStaticQuery(graphql`
        query AdminPlayersList {
            allAdminPlayersList {
                nodes {
                    isHidden
                    new
                    isInGSheets
                    code
                    pos
                    name
                    club
                    value
                    pts
                    skySportsPosition
                }
            }
        }
    `);
    const gSheetPlayers = players.filter(({ isInGSheets }) => !!isInGSheets);
    const skyOnlyPlayers = players.filter(({ isInGSheets }) => !isInGSheets);
    return { players, gSheetPlayers, skyOnlyPlayers };
};

export default usePlayers;
