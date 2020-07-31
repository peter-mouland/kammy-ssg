import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql, useStaticQuery } from 'gatsby';
import parse from 'date-fns/parse';
import { useQuery } from 'react-query';
import { fetchTransfers } from '@kammy/helpers.fetch-spreadsheet';

import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';

const inDateRange = ({ start, end }, comparison) => (
    parse(comparison) < parse(end) && parse(comparison) > parse(start)
);

const fetchr = (key, division = 0) => fetchTransfers(division);

const GameWeekTransfers = ({
    divisionUrl, divisionKey, prevGameWeek, gameWeekMinus2, selectedGameWeek, teamsByManager,
}) => {
    const { allManagers: { nodes: managersArray } } = useStaticQuery(graphql`
        query managers {
            allManagers(sort: {fields: division___order}) {
                nodes {
                    manager
                    divisionKey
                }
            }
        }
    `);
    const { status, data: transfers = [], error } = useQuery(['transfers', divisionKey], fetchr);
    const managers = managersArray.filter(({ divisionKey: div }) => div === divisionKey).map(({ manager }) => manager);
    const limitTransfers = (gw) => transfers
        .filter((transfer) => (inDateRange(gw, transfer.timestamp)))
        .map((transfer) => ({ ...transfer, gameWeek: gw.gameWeek }));
    const showTransfers = [...limitTransfers(gameWeekMinus2), ...limitTransfers(prevGameWeek)];
    const isLoading = status === 'loading';

    if (status === 'error') return <div>Error: {error.message}</div>;

    return (
        <Fragment>
            <h2>Transfer Requests</h2>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/transfers`} />
            </div>
            <TransfersTable
                isLoading={isLoading}
                transfers={showTransfers}
            />
            <TransferRequest
                teamsByManager={teamsByManager}
                isLoading={isLoading}
                managers={managers}
            />
        </Fragment>
    );
};

GameWeekTransfers.propTypes = {
    divisionUrl: PropTypes.string,
    divisionKey: PropTypes.string,
    prevGameWeek: PropTypes.object,
    gameWeekMinus2: PropTypes.object,
    selectedGameWeek: PropTypes.number,
    managers: PropTypes.array,
    teamsByManager: PropTypes.object,
};

export default GameWeekTransfers;
