import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import Interstitial from '../../interstitial';

const formatTimestamp = (ts) => {
    try {
        return format(ts, 'MMM Do, HH:mm:ss');
    } catch (e) {
        console.log(ts);
        return 'unknown date';
    }
};

const getEmoji = (status = '') => {
    switch (status.toLowerCase()) {
        case 'tbc':
            return '&#129300;'; // thinking
        case 'e':
            return '&#129324;'; // angry
        case 'y':
            return '&#129303;'; // happy
        default:
            return '';
    }
};

const TransferBody = ({ transfers }) => {
    if (transfers.length < 1) return null;
    return (
        <tbody>
            {transfers.map(
                ({ timestamp, status = '', type, manager: mgr, transferIn, transferOut, comment, gameWeek }) => (
                    <tr className={`row row--${status.toLowerCase()}`} key={timestamp}>
                        <td
                            data-col-label="status"
                            className="cell cell--status cell--show-750 cell--center"
                            dangerouslySetInnerHTML={{ __html: `${status} ${getEmoji(status)}` }}
                        />
                        <td data-col-label="gw" className="cell cell--center">
                            {gameWeek}
                        </td>
                        <td data-col-label="timestamp" className="cell cell--center cell--show-625">
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
                        <td data-col-label="comment" className="cell cell--center cell--show-925 ">
                            {comment}
                        </td>
                    </tr>
                ),
            )}
        </tbody>
    );
};

TransferBody.propTypes = {
    getGameWeekFromDate: PropTypes.func.isRequired,
    transfers: PropTypes.array.isRequired,
    Action: PropTypes.element,
};

const GameWeekTransfers = ({ transfers, isLoading }) => (
    <table className="table">
        <thead>
            <tr className="row">
                <th className="cell cell--show-750">Status</th>
                <th className="cell">GW</th>
                <th className="cell cell--show-625">Date</th>
                <th className="cell">Type</th>
                <th className="cell">Manager</th>
                <th className="cell">In</th>
                <th className="cell">Out</th>
                <th className="cell cell--show-925">Comment</th>
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

export default GameWeekTransfers;
