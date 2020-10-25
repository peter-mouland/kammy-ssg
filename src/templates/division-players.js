/* eslint-disable react/prop-types */
import React, {useState} from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import useLiveScores from '../hooks/use-live-scores';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';
import Modal from "../components/modal";
import PlayerTimeline from "../components/division-teams/components/PlayerTimeline.table";

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'isAvailable', 'new', 'value', 'code'];
const visibleStats = [
    'points',
    'apps',
    'subs',
    'gls',
    'asts',
    'cs',
    'con',
    'pensv',
    'pb',
    'tb',
    'sb',
    'ycard',
    'rcard',
];

const PlayersPage = ({ data, pageContext: { divisionKey, divisionLabel } }) => {
    const [positionTimelineProps, togglePosTimeline] = useState(null);
    const [playerTimelineProps, togglePlayerTimeline] = useState(false);
    const { liveStatsByCode } = useLiveScores();
    const players = data.allPlayers.nodes;
    const disabledPlayers = data.teamPlayers.nodes.reduce(
        (prev, player) => ({
            ...prev,
            [player.playerName]: player,
        }),
        {},
    );
    return (
        <Layout title={`${divisionLabel} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={divisionKey} />
                <div className="page-content">
                    <PlayersFilters players={players} positions={positions}>
                        {(playersFiltered) => (
                            <PlayersTable
                                onShowPlayerTimeline={togglePlayerTimeline}
                                positions={positions}
                                liveStatsByCode={liveStatsByCode}
                                players={playersFiltered}
                                disabledPlayers={disabledPlayers}
                                hiddenColumns={hiddenColumns}
                                visibleStats={visibleStats}
                            />
                        )}
                    </PlayersFilters>
                </div>
            </section>
            {playerTimelineProps && (
                <Modal
                    key="player-timeline"
                    id="player-timeline"
                    wide
                    open={!!playerTimelineProps}
                    onClose={() => togglePlayerTimeline(null)}
                >
                    <PlayerTimeline {...playerTimelineProps} />
                </Modal>
            )}
        </Layout>
    );
};

export const query = graphql`
    query AllPlayers($gameWeek: Int, $divisionKey: String) {
        teamPlayers: allTeams(filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }) {
            nodes {
                managerName
                playerName
            }
        }
        allPlayers(filter: { isHidden: { eq: false } }) {
            nodes {
                id
                code
                name
                club
                pos
                new
                isHidden
                isAvailable
                avail
                availStatus
                availReason
                availNews
                returnDate
                season {
                    apps
                    subs
                    gls
                    asts
                    cs
                    con
                    pensv
                    ycard
                    rcard
                    tb
                    pb
                    sb
                    points
                }
                gameWeeks {
                    fixtures {
                        id
                        aScore
                        aTcode
                        aTname
                        week
                        status
                        stats {
                            apps
                            asts
                            con
                            cs
                            pensv
                            gls
                            points
                            rcard
                            pb
                            tb
                            sb
                            subs
                            ycard
                        }
                        pTcode
                        hTname
                        hTcode
                        hScore
                        event
                        date
                    }
                }
            }
        }
    }
`;

export default PlayersPage;
