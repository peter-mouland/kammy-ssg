/* global fetch */
import { graphql, useStaticQuery } from 'gatsby';
import { useQuery } from 'react-query';
import { fetchSetup } from '@kammy/helpers.spreadsheet';

const URL = 'https://kammy-proxy.herokuapp.com/skysports/players';

const fetchPlayers = () =>
    fetch(URL)
        .then((response) => (response.json ? response.json() : response))
        .then((response) => response.players);
const fetchr = () => fetchSetup('Players');

const usePlayers = () => {
    const { isLoading: isGsLoading, data: gSheetPlayers = [] } = useQuery('gSheetPlayers', fetchr);
    const { isLoading: isSkyLoading, data: skyPlayers = [] } = useQuery('skyPlayers', fetchPlayers);

    const {
        allAdminPlayersList: { nodes: players },
    } = useStaticQuery(graphql`
        query AdminPlayersList {
            allAdminPlayersList {
                nodes {
                    code
                    isHidden
                    new
                    isInGSheets
                    code
                    pos
                    name: web_name
                    club
                    value: value_season
                    #                    pts
                    #                    fplPosition
                }
            }
        }
    `);
    return {
        players,
        gSheetPlayers: players.filter(({ isInGSheets }) => !!isInGSheets),
        skyOnlyPlayers: players.filter(({ isInGSheets }) => !isInGSheets),
        live: {
            isGsLoading,
            gSheetPlayers,
            isSkyLoading,
            skyPlayers,
        },
    };
};

export default usePlayers;
