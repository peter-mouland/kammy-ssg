import React from 'react';
import PropTypes from 'prop-types';
import parseISO from 'date-fns/parseISO';
import { useQuery } from 'react-query';
import { fetchTransfers } from '@kammy/helpers.spreadsheet';

import Spacer from '../spacer';
import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';
import useManagers from '../../hooks/use-managers';
import useGameWeeks from '../../hooks/use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = (key, division = 0) => fetchTransfers(division);

const GameWeekTransfers = ({ divisionUrl, divisionKey, selectedGameWeek, teamsByManager }) => {
    const { status, data: transfers = [], error } = useQuery(['transfers', divisionKey], fetchr);
    const { currentGameWeek } = useGameWeeks();
    const { getManagersFromDivision } = useManagers();
    const managers = getManagersFromDivision(divisionKey);
    const limitTransfers = (gw) =>
        transfers
            .filter((transfer) => inDateRange(gw, transfer.timestamp))
            .map((transfer) => ({ ...transfer, gameWeek: gw.gameWeek }));
    const showTransfers = limitTransfers(currentGameWeek);
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
    currentGameWeekFixtures: PropTypes.object.isRequired,
    selectedGameWeek: PropTypes.number.isRequired,
    divisionUrl: PropTypes.string.isRequired,
    divisionKey: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
};

GameWeekTransfers.defaultProps = {
    teamsByManager: {},
};

export default GameWeekTransfers;
