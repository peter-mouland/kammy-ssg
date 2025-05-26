import * as React from 'react'

import Spacer from '../spacer';
import Warning from '../../icons/warning.svg';
import * as styles from './team-warnings.module.css';

const List = ({ children }) => <ul className={styles.list}>{children}</ul>;

const Warnings = ({ warnings }) => {
    const allClubWarnings = warnings.allClubWarnings.map((clubWarnings) => (
        <p>
            <strong>{clubWarnings.manager}</strong>: {clubWarnings.message}
        </p>
    ));
    const allPosWarnings = warnings.allPosWarnings.map((posWarnings) => (
        <p>
            <strong>{posWarnings.manager}</strong>: {posWarnings.message}
        </p>
    ));
    const hasWarnings =
        warnings.duplicatePlayers.length ||
        warnings.allClubWarnings.length ||
        warnings.allPosWarnings.length ||
        warnings.newPlayers.length;

    if (!hasWarnings) {
        return (
            <p>
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: '&#128170;' }} />{' '}
                <em style={{ color: 'darkgreen' }}>No Warnings</em>
            </p>
        );
    }

    return (
        <div className={styles.warnings}>
            <h2 className={styles.title}>
                <Warning width={24} height={24} /> Team Warnings
            </h2>
            {warnings.duplicatePlayers.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The following player(s) in more than 2 teams:{' '}
                        <List>
                            {warnings.duplicatePlayers.map((player) => (
                                <li key={player}>{player}</li>
                            ))}
                        </List>
                    </div>
                </Spacer>
            )}
            {warnings.newPlayers.length > 0 && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The following <strong>new</strong> player(s):{' '}
                        <List>
                            {warnings.newPlayers.map((player) => (
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
                        Teams with players in the wrong position?
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
