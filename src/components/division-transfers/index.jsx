import React from 'react';
import PropTypes from 'prop-types';
import { graphql, useStaticQuery } from 'gatsby';
import parseISO from 'date-fns/parseISO';
import { useQuery } from 'react-query';
import { fetchTransfers } from '@kammy/helpers.spreadsheet';

import Spacer from '../spacer';
import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = (key, division = 0) => fetchTransfers(division);

const GameWeekTransfers = ({
    divisionUrl,
    divisionKey,
    currentGameWeek,
    prevGameWeek,
    gameWeekMinus2,
    selectedGameWeek,
    teamsByManager,
}) => {
    const {
        allManagers: { nodes: managersArray },
    } = useStaticQuery(graphql`
        query managers {
            allManagers(sort: { fields: division___order }) {
                nodes {
                    manager
                    divisionKey
                }
            }
        }
    `);
    const { status, data: transfers = [], error } = useQuery(['transfers', divisionKey], fetchr);
    const managers = managersArray.filter(({ divisionKey: div }) => div === divisionKey).map(({ manager }) => manager);
    const limitTransfers = (gw) =>
        transfers
            .filter((transfer) => inDateRange(gw, transfer.timestamp))
            .map((transfer) => ({ ...transfer, gameWeek: gw.gameWeek }));
    let showTransfers = [];
    showTransfers = gameWeekMinus2 ? limitTransfers(gameWeekMinus2) : showTransfers;
    showTransfers = prevGameWeek ? showTransfers.concat(limitTransfers(prevGameWeek)) : showTransfers;
    showTransfers = currentGameWeek ? showTransfers.concat(limitTransfers(currentGameWeek)) : showTransfers;
    const isLoading = status === 'loading';

    if (status === 'error') return <div>Error: {error.message}</div>;

    return (
        <div data-b-layout="container">
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/transfers`} />
                </div>
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <TransfersTable isLoading={isLoading} transfers={showTransfers} />
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <TransferRequest
                    divisionKey={divisionKey}
                    teamsByManager={teamsByManager}
                    isLoading={isLoading}
                    managers={managers}
                />
            </Spacer>
        </div>
    );
};

GameWeekTransfers.propTypes = {
    currentGameWeek: PropTypes.object.isRequired,
    prevGameWeek: PropTypes.object.isRequired,
    gameWeekMinus2: PropTypes.object.isRequired,
    selectedGameWeek: PropTypes.number.isRequired,
    divisionUrl: PropTypes.string.isRequired,
    divisionKey: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
};

export default GameWeekTransfers;
