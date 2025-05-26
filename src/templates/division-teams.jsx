/* eslint-disable react/prop-types */
import { graphql } from 'gatsby';
import * as React from 'react'

import * as Layout from '../components/layout';
import TabbedMenu, { GameWeekNav } from '../components/tabbed-division-menu';
import TeamWarnings from '../components/team-warnings';
import * as StatsTable from '../components/division-teams/division-stats.table';
import { Stats } from '../models/stats';
import CSquads from '../models/squads';
import * as Player from '../components/player';
import NavBar from '../components/nav-bar';
import useAdmin from '../hooks/use-admin';
import useDivisions from '../hooks/use-divisions';
import useManagers from '../hooks/use-managers';

const Index = ({ data, pageContext: { gameWeekIndex, divisionId } }) => {
    const { isAdmin } = useAdmin();
    const Divisions = useDivisions();
    const Managers = useManagers();
    const Division = Divisions.byId[divisionId];
    const Squads = new CSquads(data.currentTeams.group);
    const StatsList = new Stats();
    return (
        <Layout.Container title={`${Division.label} - Teams`}>
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.SecondaryNav>
                <TabbedMenu selected="teams" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.SecondaryNav>
            <Layout.TertiaryNav>
                <GameWeekNav selected="teams" divisionId={divisionId} selectedGameWeek={gameWeekIndex} />
            </Layout.TertiaryNav>
            <Layout.Body>
                <Layout.Title>Teams</Layout.Title>
                {isAdmin && <TeamWarnings warnings={Squads.warnings} />}

                {Squads.all.map((Squad) => (
                    <React.Fragment key={Squad.managerId}>
                        <StatsTable.Title>{Managers.byId[Squad.managerId].label}</StatsTable.Title>
                        <StatsTable.Table>
                            <StatsTable.Thead>
                                <StatsTable.Th>Player</StatsTable.Th>
                                <StatsTable.Th>Points</StatsTable.Th>
                                {/* remove first item, 'points', so we can make it bold, above*/}
                                {StatsList.all.slice(1).map((Stat) => (
                                    <StatsTable.Th desktopOnly key={Stat.id}>
                                        {Stat.label}
                                    </StatsTable.Th>
                                ))}
                                <StatsTable.Th separator>Next Gw</StatsTable.Th>
                            </StatsTable.Thead>
                            <StatsTable.Tbody>
                                {Squad.players.map(
                                    (SquadPlayer) =>
                                        console.log(SquadPlayer) || (
                                            <StatsTable.Tr
                                                key={SquadPlayer.code}
                                                hasChanged={SquadPlayer.hasChanged}
                                                hasWarning={
                                                    isAdmin && SquadPlayer.hasWarnings(Squad.warnings, Squads.warnings)
                                                }
                                            >
                                                <StatsTable.Td>
                                                    <Player.AllInfo player={SquadPlayer} />
                                                </StatsTable.Td>
                                                <StatsTable.Td>
                                                    <strong>{SquadPlayer.gameWeekStats.points.value}</strong>
                                                </StatsTable.Td>

                                                {/* remove first item, 'points', so we can make it bold, above*/}
                                                {StatsList.all.slice(1).map((Stat) => (
                                                    <StatsTable.Td key={Stat.id} desktopOnly>
                                                        {SquadPlayer.gameWeekStats[Stat.id].value}
                                                    </StatsTable.Td>
                                                ))}
                                                <StatsTable.Td separator>
                                                    <em>
                                                        {SquadPlayer.nextGameWeekFixtures.map((f) => (
                                                            <React.Fragment key={f.fixture_id}>
                                                                {f.oponent.club}{' '}
                                                                <span style={{ fontSize: '0.8em', color: 'grey' }}>
                                                                    ({f.oponent.awayOrHomeLabel})
                                                                </span>
                                                            </React.Fragment>
                                                        ))}
                                                    </em>
                                                </StatsTable.Td>
                                            </StatsTable.Tr>
                                        ),
                                )}
                            </StatsTable.Tbody>
                        </StatsTable.Table>
                    </React.Fragment>
                ))}
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query Teams($gameWeekIndex: Int, $divisionId: String) {
        currentTeams: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
            sort: { managerId: ASC }
        ) {
            group(field: { managerId: SELECT }) {
                squadPlayers: nodes {
                    manager {
                        managerId
                        label
                    }
                    player {
                        code
                        name
                        club
                        url
                        photo
                        position {
                            label
                        }
                        nextGameWeekFixture {
                            fixtures {
                                fixture_id
                                is_home
                                oponent {
                                    club
                                    awayOrHomeLabel
                                }
                            }
                        }
                    }
                    hasChanged
                    playerPositionId
                    squadPositionId
                    squadPosition {
                        label
                    }
                    squadPositionIndex
                    seasonToGameWeek {
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
                    gameWeekStats {
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
    }
`;

export default Index;
