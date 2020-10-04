import React from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';

import Spacer from '../spacer';
import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';
import useManagers from '../../hooks/use-managers';
import useTransfers from '../../hooks/use-transfers';
import useGameWeeks from '../../hooks/use-game-weeks';

const GameWeekTransfers = ({ divisionUrl, divisionKey, selectedGameWeek, teamsByManager }) => {
    const [cookies] = useCookies(['is-admin']);
    const { currentGameWeek } = useGameWeeks();
    const { isLoading, saveTransfer, isSaving, transfersThisGameWeek, teamsWithoutWarnings } = useTransfers({
        selectedGameWeek,
        divisionKey,
        teamsByManager,
    });
    const { getManagersFromDivision } = useManagers();
    const managers = getManagersFromDivision(divisionKey);
    const isCurrentGameWeek = selectedGameWeek === currentGameWeek.gameWeek;
    const showWarnings = cookies['is-admin'] === 'true';

    return (
        <div>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <GameWeekSwitcher selectedGameWeek={selectedGameWeek} url={`/${divisionUrl}/transfers`} />
                </div>
            </Spacer>
            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                <TransfersTable isLoading={isLoading} transfers={transfersThisGameWeek} showWarnings={showWarnings} />
            </Spacer>
            {isCurrentGameWeek && (
                <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                    <TransferRequest
                        divisionKey={divisionKey}
                        teamsByManager={teamsWithoutWarnings}
                        isLoading={isSaving}
                        saveTransfer={saveTransfer}
                        transfers={transfersThisGameWeek}
                        managers={managers}
                    />
                </Spacer>
            )}
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
