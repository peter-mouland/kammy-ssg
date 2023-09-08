/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import * as Timeline from '../components/player-timeline';
import { Stats } from '../models/stats';
import { Player } from '../models/players';

const PlayerPage = ({ data, pageContext: { playerName } }) => {
    const player = new Player(data.player);
    const StatsList = new Stats();
    return (
        <Layout.Container title={playerName}>
            <Layout.Body>
                <Timeline.PlayerHeader player={player} />
                <Timeline.Table>
                    <Timeline.Thead>
                        <Timeline.Th colspan={3} />
                        {StatsList.all.map((Stat) => (
                            <Timeline.Th key={Stat.id}>{Stat.label}</Timeline.Th>
                        ))}
                    </Timeline.Thead>
                    <Timeline.Tbody>
                        {(player.gameWeeks.all || []).map((playerGameWeek) =>
                            (playerGameWeek.fixtures.all || []).map((fixture) => (
                                <tr key={`${fixture.event}`}>
                                    <Timeline.Td>
                                        <Timeline.HomeFixture fixture={fixture} />
                                    </Timeline.Td>
                                    <Timeline.Td>
                                        <span style={{ padding: '0 4px' }}>vs</span>
                                    </Timeline.Td>
                                    <Timeline.Td>
                                        <Timeline.AwayFixture fixture={fixture} />
                                    </Timeline.Td>
                                    <Timeline.Td>
                                        <strong>{fixture.stats.points.value}</strong>
                                    </Timeline.Td>
                                    {StatsList.all.slice(1).map((Stat) => (
                                        <Timeline.Td key={Stat.id}>{fixture.stats[Stat.id].value}</Timeline.Td>
                                    ))}
                                </tr>
                            )),
                        )}
                    </Timeline.Tbody>
                    <Timeline.Tfooter>
                        <td colSpan={3} />
                        {StatsList.all.map((Stat) => (
                            <Timeline.Td key={Stat.id}>
                                <strong>{player.season[Stat.id].value}</strong>
                            </Timeline.Td>
                        ))}
                    </Timeline.Tfooter>
                </Timeline.Table>
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query Player($code: Int) {
        player: players(code: { eq: $code }) {
            id
            code
            name: web_name
            club
            position: pos
            new
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
            gameWeeks {
                fixtures {
                    aScore
                    aTname
                    aTcode
                    hScore
                    hTname
                    hTcode
                    is_home
                    was_home
                    team_h_score
                    team_a_score
                    stats {
                        apps
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        sb
                        bp
                        points
                    }
                }
            }
        }
    }
`;

export default PlayerPage;
