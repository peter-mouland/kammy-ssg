/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import formatTimestamp from '../../lib/format-timestamp';
import getEmoji from '../../lib/get-emoji';
import Interstitial from '../../../interstitial';
import useGameWeeks from '../../../../hooks/use-game-weeks';

const TransferBody = ({ transfers, Action = null, getGameWeekFromDate }) => {
    if (transfers.length < 1) return null;
    return (
        <tbody>
            {transfers.map(({ timestamp, status = '', type, manager: mgr, transferIn, transferOut, comment }) => {
                const gameWeek = timestamp && getGameWeekFromDate(timestamp);
                return (
                    <tr className={`row row--${status.toLowerCase()}`} key={`${timestamp}-${transferIn}`}>
                        <td
                            data-col-label="status"
                            className="cell cell--status show-750 cell--center"
                            dangerouslySetInnerHTML={{ __html: `${status} ${getEmoji(status)}` }}
                        />
                        <td data-col-label="gw" className="cell cell--center">
                            {gameWeek.id}
                        </td>
                        <td data-col-label="timestamp" className="cell cell--center show-625">
                            {formatTimestamp(timestamp)}
                        </td>
                        <td data-col-label="type" className="cell cell--center">
                            {type}
                        </td>
                        <td data-col-label="manager" className="cell cell--center">
                            {mgr}
                        </td>
                        <td data-col-label="transfer in" className="cell cell--center">
                            {transferIn}
                        </td>
                        <td data-col-label="transfer out" className="cell cell--center">
                            {transferOut}
                        </td>
                        <td data-col-label="comment" className="cell cell--center show-925 ">
                            {comment}
                        </td>
                        {Action && (
                            <td data-col-label="action" className="cell cell--center">
                                {Action}
                            </td>
                        )}
                    </tr>
                );
            })}
        </tbody>
    );
};

TransferBody.propTypes = {
    getGameWeekFromDate: PropTypes.func.isRequired,
    transfers: PropTypes.array.isRequired,
};

const GameWeekTransfers = ({ transfers, isLoading = false, Action = null }) => {
    const { getGameWeekFromDate } = useGameWeeks();

    return (
        <table className="table">
            <thead>
                <tr className="row">
                    <th className="cell show-750">Status</th>
                    <th className="cell">GW</th>
                    <th className="cell show-625">Date</th>
                    <th className="cell">Type</th>
                    <th className="cell">Manager</th>
                    <th className="cell">In</th>
                    <th className="cell">Out</th>
                    <th className="cell show-925">Comment</th>
                    {Action && <th className="cell" />}
                </tr>
            </thead>
            <TransferBody transfers={transfers} Action={Action} getGameWeekFromDate={getGameWeekFromDate} />
            {transfers.length === 0 && !isLoading && (
                <tbody>
                    <tr className="row">
                        <td className="cell cell--center" colSpan={8}>
                            <em>no transfers have been requested</em>
                        </td>
                    </tr>
                </tbody>
            )}
            <tfoot>
                <tr className="row row--interstitial">
                    <td colSpan={8}>{isLoading && <Interstitial message="loading transfers..." />}</td>
                </tr>
            </tfoot>
        </table>
    );
};

GameWeekTransfers.propTypes = {
    transfers: PropTypes.arrayOf(
        PropTypes.shape({
            timestamp: PropTypes.date,
            status: PropTypes.string,
            type: PropTypes.string,
            manager: PropTypes.string,
            transferIn: PropTypes.string,
            transferOut: PropTypes.string,
            comment: PropTypes.string,
        }),
    ).isRequired,
};

export default GameWeekTransfers;
