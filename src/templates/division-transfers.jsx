/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import TabbedMenu, { GameWeekNav } from '../components/tabbed-division-menu';
import CSquads from '../models/squads';
import Spacer from '../components/spacer';
import * as Transfers from '../components/division-transfers/trasfers-table';
import TransferRequest from '../components/division-transfers/transfer-request';
import useAdmin from '../hooks/use-admin';
import usePlayers from '../hooks/use-players';
import useGameWeeks from '../hooks/use-game-weeks';
import useSquadChanges from '../hooks/use-squad-changes';
import useManagers from '../hooks/use-managers';
import NavBar from '../components/nav-bar';
import useDivisions from "../hooks/use-divisions";

const PageBody = ({ data, pageContext: { gameWeekIndex: selectedGameWeek, divisionId } }) => {
    const {
        currentTeams: { group: currentTeams },
    } = data;
    const Squads = new CSquads(currentTeams);
    const Divisions = useDivisions()
    const { isAdmin } = useAdmin();
    const players = usePlayers();
    const GameWeeks = useGameWeeks();
    const Managers = useManagers();
    const { transfersQuery, changesThisGameWeek, newTeams } = useSquadChanges({
        selectedGameWeek,
        divisionId,
        Squads,
    });
    const Division = Divisions.getDivision(divisionId);
    const managersList = Managers.getManagersInDivision(Division.id);
    const isCurrentGameWeek = GameWeeks.isCurrentGameWeek(selectedGameWeek);

    return (
        <React.Fragment>
            <Layout.Title>Transfers</Layout.Title>
            <Transfers.Table>
                <Transfers.Thead showWarnings={isAdmin} />
                <Transfers.Body
                    isLoading={transfersQuery.isLoading}
                    transfers={changesThisGameWeek}
                    showWarnings={isAdmin}
                    playersByCode={players.byCode}
                />
                <Transfers.Tfoot isLoading={transfersQuery.isLoading} />
            </Transfers.Table>
            {isCurrentGameWeek && (
                <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                    <TransferRequest
                        squads={Squads}
                        divisionId={Division.id}
                        teamsByManager={newTeams}
                        transfers={changesThisGameWeek}
                        managersList={managersList}
                    />
                </Spacer>
            )}
        </React.Fragment>
    );
};
const TransfersPage = ({ data, pageContext }) => (
    <Layout.Container title={`${pageContext.divisionId} - Transfers`}>
        <Layout.PrimaryNav>
            <NavBar />
        </Layout.PrimaryNav>
        <Layout.SecondaryNav>
            <TabbedMenu
                selected="transfers"
                divisionId={pageContext.divisionId}
                selectedGameWeek={pageContext.gameWeekIndex}
            />
        </Layout.SecondaryNav>
        <Layout.TertiaryNav>
            <GameWeekNav
                selected="transfers"
                divisionId={pageContext.divisionId}
                selectedGameWeek={pageContext.gameWeekIndex}
            />
        </Layout.TertiaryNav>
        <Layout.Body>
            <PageBody data={data} pageContext={pageContext} />
        </Layout.Body>
    </Layout.Container>
);

export const query = graphql`
    query DivisionTransfers($gameWeekIndex: Int, $divisionId: String) {
        currentTeams: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
            sort: { managerId: ASC }
        ) {
            group(field: { managerId: SELECT }) {
                squadPlayers: nodes {
                    manager {
                        managerId
                        label
                    }
                    player {
                        code
                        name
                        club
                        url
                        position { label }
                        positionId
                        nextGameWeekFixture {
                            fixtures {
                                fixture_id
                                is_home
                                homeTeam {
                                    code
                                    name
                                }
                                awayTeam {
                                    code
                                    name
                                }
                            }
                        }
                    }
                    hasChanged
                    playerPositionId
                    squadPositionId
                    squadPositionIndex
                }
            }
        }
    }
`;

export default TransfersPage;
