import React from 'react';
import PropTypes from 'prop-types';

import Warning from '../../../icons/warning.svg';
import Spacer from '../../../spacer';
import styles from './tarnsfer-warnings.module.css';

const TransferWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    const team = teams[manager]
        .filter(({ playerName }) => playerName !== playerOut.name)
        .concat([
            {
                managerName: manager,
                player: playerIn,
                playerName: playerIn.name,
                pos: playerIn.pos,
            },
        ]);
    const managerTransfers = transfers.filter(
        ({ manager: managerName, type }) => managerName === manager && type === 'Transfer',
    );
    const unavailablePlayers = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return [...prev, ...teams[managerName].map(({ playerName }) => playerName)];
    }, []);
    const playersInTeams = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return {
            ...prev,
            ...teams[managerName].reduce((acc, player) => ({ ...acc, [player.playerName]: player }), {}),
        };
    }, {});

    const clubPlayers = team.reduce(
        (prev, { player }) => ({
            ...prev,
            [player.club]: [...(prev[player.club] || []), player].filter(Boolean),
        }),
        {},
    );

    const playerAlreadyBeingTransferred = transfers.find(({ transferIn }) => transferIn === playerIn.name);
    const moreThanTwoFromClub = Object.keys(clubPlayers).find((club) => clubPlayers[club].length > 2);
    const playerNotNew = !playerIn.new && changeType === 'New Player' ? playerIn.name : false;
    const playerIsNew = playerIn.new && changeType !== 'New Player' ? playerIn.name : false;
    const playerUnavailable = unavailablePlayers.includes(playerIn.name) ? playerIn.name : false;
    const positionsDontMatch = playerIn.pos !== playerOut.pos;
    const toManyTransfers = managerTransfers.length >= 2;

    const hasWarnings =
        playerIsNew ||
        moreThanTwoFromClub ||
        playerNotNew ||
        playerUnavailable ||
        positionsDontMatch ||
        toManyTransfers ||
        playerAlreadyBeingTransferred;
    if (!hasWarnings) return null;

    return (
        <div className={styles.warnings}>
            <h2 className={styles.title}>
                <Warning width={24} height={24} /> Team Warnings
            </h2>
            {toManyTransfers && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        It appears you have already made two transfers during this game week, so this move may exceed
                        your limit
                    </div>
                </Spacer>
            )}
            {playerAlreadyBeingTransferred && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        <strong>{playerIn.name}</strong> has already been selected by another manager in a pending
                        transfer.
                    </div>
                </Spacer>
            )}
            {playerUnavailable && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The player <strong>{playerUnavailable}</strong> is in more than 2 teams (
                        {playersInTeams[playerUnavailable].managerName} has him)!
                    </div>
                </Spacer>
            )}
            {playerNotNew && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The Player <strong>{playerNotNew}</strong> was transferred as 'new' but he's not new, he's old!
                    </div>
                </Spacer>
            )}
            {playerIsNew && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        The Player <strong>{playerIsNew}</strong> is marked as 'new'. You may need to make a new player
                        request instead.
                    </div>
                </Spacer>
            )}
            {moreThanTwoFromClub && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        This transfer appears to make your team exceed the limit of two per club for
                        <strong>{moreThanTwoFromClub}!</strong>
                    </div>
                </Spacer>
            )}
            {positionsDontMatch && (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    <div className="row row--warning">
                        This transfer appears to put a player in the wrong position within your team!
                    </div>
                </Spacer>
            )}
        </div>
    );
};

TransferWarnings.propTypes = {
    playerIn: PropTypes.object.isRequired,
    playerOut: PropTypes.object.isRequired,
    manager: PropTypes.string.isRequired,
    changeType: PropTypes.string.isRequired,
    teams: PropTypes.object,
    transfers: PropTypes.array,
};

TransferWarnings.defaultProps = {
    teams: {},
    transfers: [],
};

export default TransferWarnings;
