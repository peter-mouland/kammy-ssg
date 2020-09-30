/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';

import formatTimestamp from '../lib/format-timestamp';
import getEmoji from '../lib/get-emoji';
import Interstitial from '../../interstitial';
import ContextualHelp from '../../contextual-help';
import ChatIcon from '../../icons/chat.svg';
import getTransferWarnings from '../lib/get-transfer-warnings';
import usePlayers from '../../../hooks/use-players';
import Warning from '../../icons/warning.svg';

const TransferBody = ({ transfers, teamsByManager: teams }) => {
    const { players } = usePlayers();
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    if (transfers.length < 1) return null;
    const playersByName = players.reduce((prev, player) => ({ ...prev, [player.name]: player }), {});
    return (
        <tbody>
            {transfers.map(({ timestamp, status = '', type, manager, transferIn, transferOut, comment }, index) => {
                const playerIn = playersByName[transferIn];
                const playerOut = playersByName[transferOut];
                const warnings = isAdmin
                    ? getTransferWarnings({
                          transfers: index === 0 ? [] : transfers.slice(0, index),
                          manager,
                          changeType: type,
                          playerIn,
                          playerOut,
                          teams,
                      })
                    : [];

                const warningClass = warnings.length > 0 ? 'row--warning' : '';
                const warningEl =
                    warnings.length > 0 ? (
                        <ContextualHelp
                            body={warnings.join('; ')}
                            width={250}
                            Trigger={<Warning width={24} height={24} />}
                        />
                    ) : null;
                return (
                    <React.Fragment key={timestamp}>
                        <tr className={`row row--${status.toLowerCase()} ${warningClass}`} key={timestamp}>
                            {isAdmin && (
                                <td data-col-label="warnings" className="cell cell--warnings cell--center">
                                    {warningEl}
                                </td>
                            )}
                            <td
                                data-col-label="status"
                                className="cell cell--status show-750 cell--center"
                                dangerouslySetInnerHTML={{ __html: `${status} ${getEmoji(status)}` }}
                            />
                            <td data-col-label="timestamp" className="cell cell--center show-625">
                                {formatTimestamp(timestamp)}
                            </td>
                            <td data-col-label="type" className="cell cell--center">
                                {type}
                            </td>
                            <td data-col-label="manager" className="cell cell--center">
                                {manager}
                            </td>
                            <td data-col-label="transfer in" className="cell cell--center">
                                {transferIn}
                            </td>
                            <td data-col-label="transfer out" className="cell cell--center">
                                {transferOut}
                            </td>
                            <td data-col-label="comment" className="cell cell--center">
                                {comment && (
                                    <div>
                                        <span className="hide-925">
                                            <ContextualHelp
                                                body={comment}
                                                width={250}
                                                Trigger={<ChatIcon width="20px" />}
                                            />
                                        </span>
                                        <span className="show-925">{comment}</span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </React.Fragment>
                );
            })}
        </tbody>
    );
};

TransferBody.propTypes = {
    transfers: PropTypes.array.isRequired,
    teamsByManager: PropTypes.object,
};
TransferBody.defaultProps = {
    teamsByManager: {},
};

const GameWeekTransfers = ({ transfers, isLoading, teamsByManager }) => {
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    return (
        <table className="table">
            <thead>
                <tr className="row">
                    {isAdmin && <th className="cell">warning</th>}
                    <th className="cell show-750">Status</th>
                    <th className="cell show-625">Date</th>
                    <th className="cell">Type</th>
                    <th className="cell">Manager</th>
                    <th className="cell">In</th>
                    <th className="cell">Out</th>
                    <th className="cell">
                        <span className="show-925">Comment</span>
                    </th>
                </tr>
            </thead>
            <TransferBody transfers={transfers} teamsByManager={teamsByManager} />
            {transfers.length === 0 && !isLoading && (
                <tbody>
                    <tr className="row">
                        <td className="cell cell--center" colSpan={7}>
                            <em>no transfers have been requested</em>
                        </td>
                    </tr>
                </tbody>
            )}
            <tfoot>
                <tr className="row row--interstitial">
                    <td colSpan={7}>{isLoading && <Interstitial message="loading transfers..." />}</td>
                </tr>
            </tfoot>
        </table>
    );
};

GameWeekTransfers.propTypes = {
    isLoading: PropTypes.bool,
    transfers: PropTypes.array,
    teamsByManager: PropTypes.object,
};

GameWeekTransfers.defaultProps = {
    isLoading: false,
    transfers: [],
    teamsByManager: {},
};

export default GameWeekTransfers;
