/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

import formatTimestamp from '../lib/format-timestamp';
import Interstitial from '../../interstitial';
import ContextualHelp from '../../contextual-help';
import ChatIcon from '../../../icons/chat.svg';
import Warning from '../../../icons/warning.svg';
import * as styles from './styles.module.css';
import * as Player from '../../player';

export const Body = ({ transfers, showWarnings, playersByCode, isLoading }) => {
    if (transfers.length === 0 && !isLoading) {
        return (
            <tbody>
                <tr className="row">
                    <td className="cell cell--center" colSpan={7}>
                        <em>no transfers have been requested</em>
                    </td>
                </tr>
            </tbody>
        );
    }
    if (transfers.length < 1) return null;
    return (
        <tbody>
            {transfers.map((transfer) => {
                const warningClass = showWarnings && transfer.warnings.length > 0 ? 'row--warning' : '';
                const warningEl =
                    transfer.warnings.length > 0 ? (
                        <ContextualHelp
                            body={transfer.warnings.join('; ')}
                            width={250}
                            Trigger={<Warning width={24} height={24} />}
                        />
                    ) : null;

                const playerIn = playersByCode[transfer.codeIn];
                const playerOut = playersByCode[transfer.codeOut];
                return (
                    <tr
                        className={`row row--${transfer.status.toLowerCase()} ${warningClass}`}
                        key={`${transfer.date}-${transfer.codeIn}`}
                    >
                        {showWarnings && (
                            <td data-col-label="warnings" className="cell cell--warnings cell--center">
                                {warningEl}
                            </td>
                        )}
                        <td
                            data-col-label="status"
                            className="cell cell--status show-750 cell--center"
                            dangerouslySetInnerHTML={{
                                __html: `${transfer.statusAsEmoji} <span class=${styles.additional}>${transfer.status}</span>`,
                            }}
                        />
                        <td data-col-label="timestamp" className="cell cell--center show-625">
                            <span>{formatTimestamp(transfer.timestamp, 'MMM d,')}</span>
                            <span className={styles.additional}>{formatTimestamp(transfer.timestamp, ' HH:mm')}</span>
                        </td>
                        <td data-col-label="type" className="cell cell--center">
                            {transfer.type}
                        </td>
                        <td data-col-label="manager" className="cell cell--center">
                            {transfer.managerId}
                        </td>
                        <td data-col-label="transfer in" className="cell cell--center">
                            {transfer.codeIn && <Player.AllInfo player={playerIn} small />}
                        </td>
                        <td data-col-label="transfer out" className="cell cell--center">
                            {transfer.codeOut && <Player.AllInfo player={playerOut} small />}
                        </td>
                        <td data-col-label="comment" className="cell cell--center">
                            {transfer.comment && (
                                <div>
                                    <span className="hide-925">
                                        <ContextualHelp
                                            body={transfer.comment}
                                            width={250}
                                            Trigger={<ChatIcon width="20px" />}
                                        />
                                    </span>
                                    <span className="show-925">
                                        <span className={styles.additional}>{transfer.comment}</span>
                                    </span>
                                </div>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
};

Body.propTypes = {
    transfers: PropTypes.array.isRequired,
    showWarnings: PropTypes.bool,
};
Body.defaultProps = {
    showWarnings: false,
};

export const Thead = ({ showWarnings }) => (
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
);

export const Tfoot = ({ isLoading }) => (
    <tfoot>
        <tr className="row row--interstitial">
            <td colSpan={7}>{isLoading && <Interstitial message="loading transfers..." />}</td>
        </tr>
    </tfoot>
);
export const Table = ({ children }) => <table className="table">{children}</table>;
