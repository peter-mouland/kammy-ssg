import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import { useQuery } from 'react-query';
import { fetchTransfers } from '@kammy/helpers.fetch-spreadsheet';

import Interstitial from '../interstitial';
import GameWeekSwitcher from '../gameweek-switcher';

const toDate = (string = '') => {
    if (!string) return string;
    return parse(string);
};

const formatTimestamp = (ts) => format(ts, 'MMM Do, HH:mm:ss');

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
            {transfers.map(({
                timestamp, status = '', type, manager: mgr, transferIn, transferOut, comment, gameWeek,
            }) => {
                return (
                    <tr className={`row row--${status.toLowerCase()}`} key={timestamp}>
                        <td data-col-label='status' className={'cell cell--status cell--show-750 cell--center'}
                            dangerouslySetInnerHTML={{ __html: `${status} ${getEmoji(status)}` }}/>
                        <td data-col-label='gw' className={'cell cell--center'}>{gameWeek}</td>
                        <td data-col-label='timestamp'
                            className={'cell cell--center cell--show-625'}>{formatTimestamp(timestamp)}</td>
                        <td data-col-label='type' className={'cell cell--center'}>{type}</td>
                        <td data-col-label='manager' className={'cell cell--center'}>{mgr}</td>
                        <td data-col-label='transfer in' className={'cell cell--center'}>{transferIn}</td>
                        <td data-col-label='transfer out' className={'cell cell--center'}>{transferOut}</td>
                        <td data-col-label='comment' className={'cell cell--center cell--show-925 '}>{comment}</td>
                    </tr>
                );
            })}
        </tbody>
    );
};

TransferBody.propTypes = {
    getGameWeekFromDate: PropTypes.func.isRequired,
    transfers: PropTypes.array.isRequired,
    Action: PropTypes.element,
};

const inDateRange = ({ start, end }, comparison) => (
    toDate(comparison) < toDate(end) && toDate(comparison) > toDate(start)
);

const fetchr = (key, division = 0) => fetchTransfers(division);


const GameWeekTransfers = ({
    managers,
    divisionUrl,
    divisionKey,
    currentGameWeek,
    prevGameWeek,
    gameWeekMinus2,
    selectedGameWeek,
}) => {
    const {
        status, data: transfers = [], error,
    } = useQuery(['transfers', divisionKey], fetchr);

    const limitTransfers = (gw) => transfers
        .filter((transfer) => (inDateRange(gw, transfer.timestamp)))
        .map((transfer) => ({ ...transfer, gameWeek: gw.gameWeek }));
    const previousGameWeekTransfers = limitTransfers(prevGameWeek);
    const previousGameWeekTransfers2 = limitTransfers(gameWeekMinus2);
    const showTransfers = [...previousGameWeekTransfers2, ...previousGameWeekTransfers];
    const isLoading = status === 'loading';

    if (status === 'error') return <div>Error: {error.message}</div>;

    return (
        <Fragment>
            <h2>Transfer Requests</h2>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/transfers`} />
            </div>
            <table className={'table'}>
                <thead>
                    <tr className={'row'}>
                        <th className={'cell cell--show-750'}>Status</th>
                        <th className={'cell'}>GW</th>
                        <th className={'cell cell--show-625'}>Date</th>
                        <th className={'cell'}>Type</th>
                        <th className={'cell'}>Manager</th>
                        <th className={'cell'}>In</th>
                        <th className={'cell'}>Out</th>
                        <th className={'cell cell--show-925'}>Comment</th>
                    </tr>
                </thead>
                <TransferBody transfers={showTransfers}/>
                {transfers.length === 0 && !isLoading && (
                    <tbody>
                        <tr className={'row'}>
                            <td className={'cell cell--center'} colSpan={7}><em>no transfers have been
                                requested</em></td>
                        </tr>
                    </tbody>
                )}
                <tfoot>
                    <tr className={'row row--interstitial'}>
                        <td colSpan={7}>
                            {(isLoading) && (
                                <Interstitial message='loading transfers...'/>
                            )}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </Fragment>
    );
};

GameWeekTransfers.propTypes = {
    transfers: PropTypes.arrayOf(PropTypes.shape({
        timestamp: PropTypes.string,
        status: PropTypes.string,
        type: PropTypes.string,
        manager: PropTypes.string,
        transferIn: PropTypes.string,
        transferOut: PropTypes.string,
        comment: PropTypes.string,
    })).isRequired,
    isLoading: PropTypes.bool,
    Action: PropTypes.element,
    getGameWeekFromDate: PropTypes.func.isRequired,
};

GameWeekTransfers.defaultProps = {
    Action: null,
    isLoading: false,
};

export default GameWeekTransfers;
