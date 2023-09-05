/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
// import useLiveScores from '../hooks/use-live-scores';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'new', 'value', 'code'];
const visibleStats = ['points', 'apps', 'gls', 'asts', 'cs', 'con', 'pensv', 'bp', 'sb', 'ycard', 'rcard'];

const setClubs = ({ players = [] }) => {
    const clubs = new Set();
    players.forEach((player) => clubs.add(player.club));
    const clubsArr = [...clubs.keys()].sort();
    return clubsArr.filter((item) => item);
};

const PlayersPage = ({ data, pageContext: { divisionKey, divisionLabel } }) => {
    // const { liveStatsByCode } = useLiveScores();
    const allPlayers = useMemo(
        () => data.allPlayers.nodes.filter((player) => !player.isHidden),
        [data.allPlayers.nodes],
    );
    const teamPlayers = data.teamPlayers.nodes;
    const clubs = useMemo(() => setClubs({ players: allPlayers }), [allPlayers]);
    const disabledPlayers = useMemo(
        () =>
            teamPlayers.reduce(
                (prev, player) => ({
                    ...prev,
                    [player.playerCode]: player,
                }),
                {},
            ),
        [teamPlayers],
    );
    return (
        <Layout title={`${divisionLabel} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={divisionKey} />
                <div className="page-content">
                    <PlayersFilters players={allPlayers} positions={positions} clubs={clubs}>
                        {(playersFiltered) => (
                            <PlayersTable
                                positions={positions}
                                // liveStatsByCode={liveStatsByCode}
                                players={playersFiltered}
                                disabledPlayers={disabledPlayers}
                                hiddenColumns={hiddenColumns}
                                visibleStats={visibleStats}
                            />
                        )}
                    </PlayersFilters>
                </div>
            </section>
        </Layout>
    );
};

export const query = graphql`
    query AllPlayers($gameWeek: Int, $divisionKey: String) {
        teamPlayers: allTeams(filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }) {
            nodes {
                managerName
                playerCode
                player {
                    code
                    web_name
                }
            }
        }
        allPlayers(filter: { isHidden: { eq: false } }) {
            nodes {
                id
                code
                name: web_name
                club
                pos
                new
                isHidden
                url
                season {
                    apps
                    gls
                    asts
                    cs
                    con
                    pensv
                    ycard
                    rcard
                    bp
                    sb
                    points
                }
            }
        }
    }
`;

export default PlayersPage;
