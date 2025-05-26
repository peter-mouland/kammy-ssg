/* eslint-disable react/prop-types */
import * as React from 'react'
import { graphql } from 'gatsby';

import * as Layout from '../components/layout';
import Spacer from '../components/spacer';
import MakeChanges from '../components/manager/components/makes-changes';
import CManagers from '../models/managers';
import CSquads from '../models/squads';
import SquadOnPitch from '../components/manager/components/squad-on-pitch';

const CHANGES = 'CHANGES';
const GW_POINTS = 'GW_POINTS';

// todo:
//    1. need all manager teams to work out valid transfers
//    2. auto validate swap
const ManagerPage = ({ data, pageContext: { managerId, divisionId, gameWeekIndex } }) => {
    const {
        currentTeams: { group: currentTeams },
    } = data;
    const Squads = new CSquads(currentTeams);
    const [showTab, setShowTab] = React.useState(GW_POINTS);
    const currentTeam = Squads.byManagerId[managerId];
    return (
        <Layout.Container title={managerId}>
            <Layout.Body>
                <Layout.Title>{managerId}&apos;s Team</Layout.Title>

                <Spacer all={{ stackH: Spacer.spacings.SMALL }}>
                    <button type="button" onClick={() => setShowTab(GW_POINTS)}>
                        Current Team
                    </button>
                    <button type="button" onClick={() => setShowTab(CHANGES)}>
                        Changes
                    </button>
                </Spacer>
                {showTab === GW_POINTS ? <SquadOnPitch squad={currentTeam} /> : null}
                {showTab === CHANGES ? (
                    <MakeChanges
                        teamsByManager={Squads.byManagerId}
                        managerId={managerId}
                        divisionId={divisionId}
                        gameWeekIndex={gameWeekIndex}
                    />
                ) : null}
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query CurrentTeam($gameWeekIndex: Int, $divisionId: String) {
        currentTeams: allTeams(
            filter: { gameWeekIndex: { eq: $gameWeekIndex }, manager: { divisionId: { eq: $divisionId } } }
            sort: { managerId: ASC }
        ) {
            group(field: { managerId: SELECT }) {
                squadPlayers: nodes {
                    playerCode
                    playerPositionId
                    squadPositionId
                    squadPositionIndex
                    manager {
                        managerId
                        label
                    }
                    player {
                        club
                        name
                        code
                        positionId
                        url
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
                }
            }
        }
    }
`;
export default ManagerPage;
