import React from 'react';
import PropTypes from 'prop-types';
import { useCookies } from 'react-cookie';

import Spacer from '../spacer';
import GameWeekSwitcher from '../gameweek-switcher';
import TransfersTable from './trasfers-table';
import TransferRequest from './transfer-request';
import useManagers from '../../hooks/use-managers';
import useSquadChanges from '../../hooks/use-squad-changes';
import useGameWeeks from '../../hooks/use-game-weeks';
import usePlayers from '../../hooks/use-players';

const GameWeekTransfers = ({ divisionUrl, divisionKey, selectedGameWeek, teamsByManager }) => {
    const [cookies] = useCookies(['is-admin']);
    const { currentGameWeek } = useGameWeeks();
    const { isLoading, saveSquadChange, isSaving, changesThisGameWeek, newTeams } = useSquadChanges({
        selectedGameWeek,
        divisionKey,
        teamsByManager,
    });
    console.log({ divisionUrl, divisionKey, selectedGameWeek, teamsByManager });
    const { playersByCode } = usePlayers();
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
                <TransfersTable
                    isLoading={isLoading}
                    transfers={changesThisGameWeek}
                    showWarnings={showWarnings}
                    playersByCode={playersByCode}
                />
            </Spacer>
            {isCurrentGameWeek && (
                <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                    <TransferRequest
                        playersByCode={playersByCode}
                        divisionKey={divisionKey}
                        teamsByManager={newTeams}
                        isLoading={isSaving}
                        saveSquadChange={saveSquadChange}
                        transfers={changesThisGameWeek}
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
