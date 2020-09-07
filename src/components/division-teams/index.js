import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Modal from '../modal';
import Table from './DivisionStats.table';
import PositionTimeline from './components/PositionTimeline.table';
import PlayerTimeline from './components/PlayerTimeline.table';
import validateClub from './lib/validate-club';
import validatePositions from './lib/validate-pos';
import validatePlayer from './lib/validate-player';
import validateNewPlayers from './lib/validate-new-player';
import Spacer from '../spacer';
import Warning from '../icons/warning.svg';
import styles from './styles.module.css';

const bem = bemHelper({ block: 'division-stats' });

const List = ({ children }) => <ul className={styles.list}>{children}</ul>;
const Warnings = ({ teams }) => {
    const newPlayers = validateNewPlayers(teams) || [];
    const duplicatePlayers = validatePlayer(teams) || [];
    const clubWarnings = validateClub(teams);
    const posWarnings = validatePositions(teams);
    const allClubWarnings = Object.keys(clubWarnings).map((manager) => (
        <p>
            <strong>{manager}</strong>: {clubWarnings[manager].join(', ')}
        </p>
    ));
    const allPosWarnings = Object.keys(posWarnings).map((manager) => (
        <p>
            <strong>{manager}</strong>: {posWarnings[manager].join(', ')}
        </p>
    ));
    if (!duplicatePlayers.length && !allClubWarnings.length && !allPosWarnings.length && !newPlayers) return null;
    return (
        <div className={styles.warnings}>
            <h2 className={styles.title}>
                <Warning width={24} height={24} /> Admin Warnings
            </h2>
            {duplicatePlayers.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The following player(s) in more than 2 teams:{' '}
                        <List>
                            {duplicatePlayers.map((player) => (
                                <li key={player}>{player}</li>
                            ))}
                        </List>
                    </div>
                </Spacer>
            )}
            {newPlayers.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The following <strong>new</strong> player(s):{' '}
                        <List>
                            {newPlayers.map((player) => (
                                <li key={player}>{player}</li>
                            ))}
                        </List>
                    </div>
                </Spacer>
            )}
            {allClubWarnings.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        Teams with 3+ players from the same club:
                        <List>
                            {allClubWarnings.map((player) => (
                                <li key={player}>{player}</li>
                            ))}
                        </List>
                    </div>
                </Spacer>
            )}
            {allPosWarnings.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        Teams with Mismatched players:
                        <List>
                            {allPosWarnings.map((player) => (
                                <li key={player}>{player}</li>
                            ))}
                        </List>
                    </div>
                </Spacer>
            )}
        </div>
    );
};

const DivisionStats = ({ teams, previousTeams, selectedGameWeek, divisionUrl }) => {
    const [cookies] = useCookies(['is-admin']);
    const [positionTimelineProps, togglePosTimeline] = useState(null);
    const [playerTimelineProps, togglePlayerTimeline] = useState(false);
    const isAdmin = cookies['is-admin'] === 'true' || false;

    return (
        <section id="teams-page" className={bem()} data-b-layout="container">
            <div data-b-layout="vpad">
                <GameWeekSwitcher url={`/${divisionUrl}/teams`} selectedGameWeek={selectedGameWeek} />
            </div>

            {isAdmin && <Warnings teams={teams} />}

            <div data-b-layout="vpad">
                <div className={bem(null, null, 'page-content')} data-b-layout="row vpad">
                    <div>
                        {positionTimelineProps && (
                            <Modal
                                key="timeline"
                                id="timeline"
                                wide
                                title={`${positionTimelineProps.position} Timeline`}
                                open={!!positionTimelineProps}
                                onClose={() => togglePosTimeline(null)}
                            >
                                <PositionTimeline {...positionTimelineProps} />
                            </Modal>
                        )}
                        {playerTimelineProps && (
                            <Modal
                                key="player-timeline"
                                id="player-timeline"
                                wide
                                title={`${playerTimelineProps.player.name} Timeline`}
                                open={!!playerTimelineProps}
                                onClose={() => togglePlayerTimeline(null)}
                            >
                                <PlayerTimeline {...playerTimelineProps} />
                            </Modal>
                        )}
                    </div>
                    <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
                        <Table
                            onShowPositionTimeline={togglePosTimeline}
                            onShowPlayerTimeline={togglePlayerTimeline}
                            selectedGameWeek={selectedGameWeek}
                            teams={teams}
                            previousTeams={previousTeams}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

DivisionStats.propTypes = {
    selectedGameWeek: PropTypes.number,
    label: PropTypes.string.isRequired,
    divisionUrl: PropTypes.string.isRequired,
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
};

DivisionStats.defaultProps = {
    selectedGameWeek: 1,
    teams: null,
    previousTeams: null,
};

export default DivisionStats;
