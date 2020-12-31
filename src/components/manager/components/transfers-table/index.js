/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import Interstitial from '../../../interstitial';
import ContextualHelp from '../../../contextual-help';
import ChatIcon from '../../../icons/chat.svg';
import Warning from '../../../icons/warning.svg';
import Player from '../../../player';
import formatTimestamp from '../../lib/format-timestamp';
import getEmoji from '../../lib/get-emoji';
import styles from './styles.module.css';

const TransferBody = ({ changes, showWarnings, playersByName }) => {
    if (changes.length < 1) return null;
    return (
        <tbody>
            {changes.map(({ timestamp, status = '', type, transferIn, transferOut, comment, warnings }) => {
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
                            <td data-col-label="transfer in" className="cell cell--center">
                                {transferIn && <Player player={playersByName[transferIn]} small />}
                            </td>
                            <td data-col-label="transfer out" className="cell cell--center">
                                {transferOut && <Player player={playersByName[transferOut]} small />}
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
    changes: PropTypes.array.isRequired,
    showWarnings: PropTypes.bool,
};
TransferBody.defaultProps = {
    showWarnings: false,
};

const TransfersTable = ({ changes, isLoading, showWarnings, playersByName }) => (
    <table className="table">
        <thead>
            <tr className="row">
                {showWarnings && <th className="cell">warning</th>}
                <th className="cell show-750">Status</th>
                <th className="cell show-625">Date</th>
                <th className="cell">Type</th>
                <th className="cell">In</th>
                <th className="cell">Out</th>
                <th className="cell">
                    <span className="show-925">Comment</span>
                </th>
            </tr>
        </thead>
        <TransferBody changes={changes} showWarnings={showWarnings} playersByName={playersByName} />
        {changes.length === 0 && !isLoading && (
            <tbody>
                <tr className="row">
                    <td className="cell cell--center" colSpan={7}>
                        <em>no changes have been requested</em>
                    </td>
                </tr>
            </tbody>
        )}
        <tfoot>
            <tr className="row row--interstitial">
                <td colSpan={7}>{isLoading && <Interstitial message="loading changes..." />}</td>
            </tr>
        </tfoot>
    </table>
);

TransfersTable.propTypes = {
    showWarnings: PropTypes.bool,
    isLoading: PropTypes.bool,
    changes: PropTypes.array,
};

TransfersTable.defaultProps = {
    showWarnings: false,
    isLoading: false,
    changes: [],
};

export default TransfersTable;
