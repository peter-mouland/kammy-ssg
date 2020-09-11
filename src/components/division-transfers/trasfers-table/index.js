/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import formatTimestamp from '../lib/format-timestamp';
import getEmoji from '../lib/get-emoji';
import Interstitial from '../../interstitial';
import ContextualHelp from '../../contextual-help';
import ChatIcon from '../../icons/chat.svg';

const TransferBody = ({ transfers }) => {
    if (transfers.length < 1) return null;
    return (
        <tbody>
            {transfers.map(({ timestamp, status = '', type, manager: mgr, transferIn, transferOut, comment }) => (
                <React.Fragment key={timestamp}>
                    <tr className={`row row--${status.toLowerCase()}`} key={timestamp}>
                        <td
                            data-col-label="status"
                            className="cell cell--status show-750 cell--center"
                            dangerouslySetInnerHTML={{ __html: `${status} ${getEmoji(status)}` }}
                        />
                        <td data-col-label="timestamp" className="cell cell--center show-625">
                            {formatTimestamp(timestamp, { fromGMT: true })}
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
                        <td data-col-label="comment" className="cell cell--center">
                            {comment && (
                                <div>
                                    <span className="hide-925">
                                        <ContextualHelp body={comment} width={250} Trigger={<ChatIcon width="20px" />} />
                                    </span>
                                    <span className="show-925">{comment}</span>
                                </div>
                            )}
                        </td>
                    </tr>
                </React.Fragment>
            ))}
        </tbody>
    );
};

TransferBody.propTypes = {
    transfers: PropTypes.array.isRequired,
};

const GameWeekTransfers = ({ transfers, isLoading }) => (
    <table className="table">
        <thead>
            <tr className="row">
                <th className="cell show-750">Status</th>
                <th className="cell show-625">Date</th>
                <th className="cell">Type</th>
                <th className="cell">Manager</th>
                <th className="cell">In</th>
                <th className="cell">Out</th>
                <th className="cell"><span className="show-925">Comment</span></th>
            </tr>
        </thead>
        <TransferBody transfers={transfers} />
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

GameWeekTransfers.propTypes = {
    isLoading: PropTypes.bool,
    transfers: PropTypes.array,
};

GameWeekTransfers.defaultProps = {
    isLoading: false,
    transfers: [],
};

export default GameWeekTransfers;
