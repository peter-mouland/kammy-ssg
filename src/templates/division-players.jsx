/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import * as Layout from '../components/layout';
import TabbedMenu, { GameWeekNav } from '../components/tabbed-division-menu';
import CPositions from '../models/position';
import { Stats } from '../models/stats';
import CDivisions from '../models/division';
import { Players } from '../models/players';
import useClubs from '../hooks/use-clubs';
import NavBar from '../components/nav-bar';
import useManagers from '../hooks/use-managers';
import useGameWeeks from '../hooks/use-game-weeks';

const PlayersPage = ({ data, pageContext: { divisionId, gameWeekIndex } }) => {
    const Divisions = new CDivisions();
    const Division = Divisions.getDivision(divisionId);
    const GameWeeks = useGameWeeks();
    const Positions = new CPositions();
    const StatsList = new Stats();
    const managedPlayers = data.teamPlayers.nodes;
    const allPlayers = new Players(data.allPlayers.nodes, {
        gameWeekIndex: gameWeekIndex === GameWeeks.currentGameWeekIndex ? null : gameWeekIndex,
    });
    allPlayers.addManagers(managedPlayers);
    const allManagers = useManagers();
    const clubs = useClubs();
    return (
        <Layout.Container title={`${Division.label} - Players`}>
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.SecondaryNav>
                <TabbedMenu selected="players" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.SecondaryNav>
            <Layout.TertiaryNav>
                <GameWeekNav selected="players" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.TertiaryNav>
            <Layout.Body>
                <Layout.Title>
                    All Players {!GameWeeks.isCurrentGameWeek(gameWeekIndex) ? <span>(GW{gameWeekIndex})</span> : null}
                </Layout.Title>
                <PlayersFilters
                    players={allPlayers.all}
                    positions={Positions}
                    clubs={clubs}
                    managers={allManagers.byDivisionId[divisionId]}
                >
                    {(playersFiltered) => (
                        <PlayersTable Positions={Positions} players={playersFiltered} Stats={StatsList} />
                    )}
                </PlayersFilters>
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query AllPlayers($gameWeekIndex: Int, $divisionId: String) {
        teamPlayers: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
        ) {
            nodes {
                manager {
                    label
                    managerId
                }
                playerCode
            }
        }
        allPlayers(filter: { isHidden: { eq: false } }) {
            nodes {
                url
                name
                club
                positionId
                new
                code
                form
                seasonStats {
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
                gameWeeks {
                    gameWeekIndex
                    stats {
                        apps
                        asts
                        bp
                        con
                        cs
                        gls
                        pensv
                        points
                        rcard
                        sb
                        ycard
                    }
                }
            }
        }
    }
`;

export default PlayersPage;
