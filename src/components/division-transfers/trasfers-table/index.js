/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import formatTimestamp from '../lib/format-timestamp';
import getEmoji from '../lib/get-emoji';
import Interstitial from '../../interstitial';
import ContextualHelp from '../../contextual-help';
import ChatIcon from '../../icons/chat.svg';
import Warning from '../../icons/warning.svg';
import styles from './styles.module.css';
import Player from '../../player';

const TransferBody = ({ transfers, showWarnings }) => {
    if (transfers.length < 1) return null;
    return (
        <tbody>
            {transfers.map(({ timestamp, status = '', type, manager, transferIn, transferOut, comment, warnings }) => {
                const warningClass = showWarnings && warnings.length > 0 ? 'row--warning' : '';
                const warningEl =
                    warnings.length > 0 ? (
                        <ContextualHelp
                            body={warnings.join('; ')}
                            width={250}
                            Trigger={<Warning width={24} height={24} />}
                        />
                    ) : null;
                return (
                    <React.Fragment key={`${timestamp}-${transferIn}`}>
                        <tr className={`row row--${status.toLowerCase()} ${warningClass}`}>
                            {showWarnings && (
                                <td data-col-label="warnings" className="cell cell--warnings cell--center">
                                    {warningEl}
                                </td>
                            )}
                            <td
                                data-col-label="status"
                                className="cell cell--status show-750 cell--center"
                                dangerouslySetInnerHTML={{
                                    __html: `${getEmoji(status)} <span class=${styles.additional}>${status}</span>`,
                                }}
                            />
                            <td data-col-label="timestamp" className="cell cell--center show-625">
                                <span>{formatTimestamp(timestamp, 'MMM d,')}</span>
                                <span className={styles.additional}>{formatTimestamp(timestamp, ' HH:mm')}</span>
                            </td>
                            <td data-col-label="type" className="cell cell--center">
                                {type}
                            </td>
                            <td data-col-label="manager" className="cell cell--center">
                                {manager}
                            </td>
                            <td data-col-label="transfer in" className="cell cell--center">
                                {transferIn && <Player name={transferIn} />}
                            </td>
                            <td data-col-label="transfer out" className="cell cell--center">
                                {transferOut && <Player name={transferOut} />}
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
                                        <span className="show-925">
                                            <span className={styles.additional}>{comment}</span>
                                        </span>
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
    showWarnings: PropTypes.bool,
};
TransferBody.defaultProps = {
    showWarnings: false,
};

const GameWeekTransfers = ({ transfers, isLoading, showWarnings }) => (
    <table className="table">
        <thead>
            <tr className="row">
                {showWarnings && <th className="cell">warning</th>}
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
        <TransferBody transfers={transfers} showWarnings={showWarnings} />
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
    showWarnings: PropTypes.bool,
    isLoading: PropTypes.bool,
    transfers: PropTypes.array,
};

GameWeekTransfers.defaultProps = {
    showWarnings: false,
    isLoading: false,
    transfers: [],
};

export default GameWeekTransfers;
