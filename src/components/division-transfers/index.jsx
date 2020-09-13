import React from 'react';
import PropTypes from 'prop-types';

import Spacer from '../spacer';
import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';
import useManagers from '../../hooks/use-managers';
import useTransfers from '../../hooks/use-transfers';

const GameWeekTransfers = ({ divisionUrl, divisionKey, selectedGameWeek, teamsByManager }) => {
    const { isLoading, saveTransfer, isSaving, transfersThisGameWeek } = useTransfers({ divisionKey });
    const { getManagersFromDivision } = useManagers();
    const managers = getManagersFromDivision(divisionKey);

    return (
        <div>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/transfers`} />
                </div>
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <TransfersTable isLoading={isLoading} transfers={transfersThisGameWeek} />
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <TransferRequest
                    divisionKey={divisionKey}
                    teamsByManager={teamsByManager}
                    isLoading={isSaving}
                    saveTransfer={saveTransfer}
                    managers={managers}
                />
            </Spacer>
        </div>
    );
};

GameWeekTransfers.propTypes = {
    selectedGameWeek: PropTypes.number.isRequired,
    divisionUrl: PropTypes.string.isRequired,
    divisionKey: PropTypes.string.isRequired,
    teamsByManager: PropTypes.object,
};

GameWeekTransfers.defaultProps = {
    teamsByManager: {},
};

export default GameWeekTransfers;
