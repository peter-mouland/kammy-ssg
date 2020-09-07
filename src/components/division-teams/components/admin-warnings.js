import React from 'react';
import PropTypes from 'prop-types';

import validateClub from '../lib/validate-club';
import validatePositions from '../lib/validate-pos';
import validatePlayer from '../lib/validate-player';
import validateNewPlayers from '../lib/validate-new-player';
import Spacer from '../../spacer';
import Warning from '../../icons/warning.svg';
import styles from './admin-warnings.module.css';

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
    if (!duplicatePlayers.length && !allClubWarnings.length && !allPosWarnings.length && !newPlayers.length) {
        return (
            <p>
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: '&#128170;' }} />{' '}
                <em style={{ color: 'darkgreen' }}>No admin warnings</em>
            </p>
        );
    }

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

export default Warnings;
