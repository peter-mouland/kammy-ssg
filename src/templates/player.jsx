/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import NavBar from '../components/nav-bar';
import * as Layout from '../components/layout';
import * as Timeline from '../components/player-timeline';
import { Stats } from '../models/stats';
import { Player } from '../models/players';

const StatsList = new Stats();

const Fixture = ({ fixture }) => (
    <Timeline.Tr key={`${fixture.event}`} light={!fixture.finished}>
        <Timeline.Td>
            <Timeline.HomeFixture fixture={fixture} />
        </Timeline.Td>
        <Timeline.Td>vs</Timeline.Td>
        <Timeline.Td>
            <Timeline.AwayFixture fixture={fixture} />
        </Timeline.Td>
        <Timeline.Td>{fixture.finished ? <strong>{fixture.stats.points.value}</strong> : '-'}</Timeline.Td>
        {StatsList.all.slice(1).map((Stat) => (
            <Timeline.Td key={Stat.id}>{fixture.finished ? fixture.stats[Stat.id].value : ''}</Timeline.Td>
        ))}
    </Timeline.Tr>
);

const PlayerPage = ({ data, pageContext: { playerName } }) => {
    const player = new Player(data.player);
    return (
        <Layout.Container title={playerName}>
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
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
                            (playerGameWeek.fixtures.all || [])
                                .filter(({ finished }) => finished)
                                .map((fixture) => <Fixture fixture={fixture} />),
                        )}
                    </Timeline.Tbody>
                    <Timeline.Tr>
                        <td colSpan={3} />
                        {StatsList.all.map((Stat) => (
                            <Timeline.Td key={Stat.id}>
                                <strong>{player.seasonStats[Stat.id].value}</strong>
                            </Timeline.Td>
                        ))}
                    </Timeline.Tr>
                    {(player.gameWeeks.all || []).map((playerGameWeek) =>
                        (playerGameWeek.fixtures.all || [])
                            .filter(({ finished }) => !finished)
                            .map((fixture) => <Fixture fixture={fixture} />),
                    )}
                </Timeline.Table>
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query Player($code: Int) {
        player: players(code: { eq: $code }) {
            assists
            bonus
            bps
            chance_of_playing_next_round
            chance_of_playing_this_round
            clean_sheets
            clean_sheets_per_90
            club
            code
            corners_and_indirect_freekicks_order
            corners_and_indirect_freekicks_text
            creativity
            creativity_rank
            creativity_rank_type
            direct_freekicks_order
            direct_freekicks_text
            dreamteam_count
            element_id
            element_type
            ep_next
            ep_this
            event_points
            expected_assists
            expected_assists_per_90
            expected_goal_involvements
            expected_goal_involvements_per_90
            expected_goals
            expected_goals_conceded
            expected_goals_conceded_per_90
            expected_goals_per_90
            first_name
            form
            form_rank
            form_rank_type
            goals_conceded
            goals_conceded_per_90
            goals_scored
            ict_index
            ict_index_rank
            ict_index_rank_type
            in_dreamteam
            influence
            influence_rank
            influence_rank_type
            minutes
            name
            new
            news
            news_added
            now_cost
            now_cost_rank
            now_cost_rank_type
            own_goals
            penalties_missed
            penalties_order
            penalties_saved
            penalties_text
            photo
            points_per_game
            points_per_game_rank
            points_per_game_rank_type
            positionId
            position {
                label
            }
            red_cards
            saves
            saves_per_90
            second_name
            selected_by_percent
            selected_rank
            selected_rank_type
            special
            starts
            starts_per_90
            status
            team
            team_code
            threat
            threat_rank
            threat_rank_type
            transfers_in
            total_points
            transfers_in_event
            transfers_out
            transfers_out_event
            url
            value_form
            value_season
            web_name
            yellow_cards
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
                fixtures {
                    is_home
                    was_home
                    team_a_score
                    team_h_score
                    started
                    finished
                    awayTeam {
                        name
                        code
                    }
                    homeTeam {
                        name
                        code
                    }
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
