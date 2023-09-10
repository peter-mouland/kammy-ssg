/* eslint-disable react/prop-types */
import { graphql } from 'gatsby';
import React from 'react';
import { useCookies } from 'react-cookie';

import * as Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';
import TeamWarnings from '../components/team-warnings';
import * as StatsTable from '../components/division-teams/division-stats.table';
import { Stats } from '../models/stats';
import CSquads from '../models/squads';
import CPositions from '../models/position';
import CDivisions from '../models/division';
import CManagers from '../models/managers';
import * as Player from '../components/player';
import * as styles from '../components/division-teams/division-stats.module.css';

const Index = ({ data, pageContext: { gameWeekIndex: selectedGameWeek, divisionId } }) => {
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    const {
        allManagers: { nodes: allManagers },
        currentTeams: { group: currentTeams },
    } = data;

    const Positions = new CPositions();
    const Divisions = new CDivisions();
    const Division = Divisions.byId[divisionId];
    const Managers = new CManagers(allManagers);
    const Squads = new CSquads(currentTeams);
    const StatsList = new Stats();
    return (
        <Layout.Container title={`${Division.label} - Teams`}>
            <TabbedMenu division={divisionId} selected="teams" selectedGameWeek={selectedGameWeek} />
            <Layout.Body>
                <Layout.Title>Teams</Layout.Title>
                {isAdmin && <TeamWarnings warnings={Squads.warnings} />}

                <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
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
                                    {Squad.players.map((SquadPlayer) => (
                                        <StatsTable.Tr
                                            key={SquadPlayer.code}
                                            className="cell cell--player"
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
                                                <StatsTable.Td key={Stat.id}>
                                                    {SquadPlayer.gameWeekStats[Stat.id].value}
                                                </StatsTable.Td>
                                            ))}
                                            <StatsTable.Td separator>
                                                <em>
                                                    {SquadPlayer.nextGameWeekFixtures.map((f) => (
                                                        <React.Fragment key={f.fixture_id}>
                                                            {f.is_home ? f.awayTeam.name : f.homeTeam.name}{' '}
                                                            <span className={styles.small}>
                                                                {f.is_home ? '(h)' : '(a)'}
                                                            </span>
                                                        </React.Fragment>
                                                    ))}
                                                </em>
                                            </StatsTable.Td>
                                        </StatsTable.Tr>
                                    ))}
                                </StatsTable.Tbody>
                            </StatsTable.Table>
                        </React.Fragment>
                    ))}
                </div>
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query Teams($gameWeekIndex: Int, $divisionId: String) {
        allManagers(filter: { divisionId: { eq: $divisionId } }, sort: { division: { order: ASC } }) {
            nodes {
                label
                managerId
                divisionId
            }
        }

        currentTeams: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
            sort: { managerId: ASC }
        ) {
            group(field: { managerId: SELECT }) {
                squadPlayers: nodes {
                    manager {
                        managerId
                    }
                    player {
                        code
                        name
                        club
                        url
                        nextGameWeekFixture {
                            fixtures {
                                fixture_id
                                is_home
                                homeTeam {
                                    code
                                    name
                                }
                                awayTeam {
                                    code
                                    name
                                }
                            }
                        }
                    }
                    hasChanged
                    playerPositionId
                    squadPositionId
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
