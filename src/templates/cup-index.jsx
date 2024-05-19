/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import '@kammy/bootstrap';

import * as Layout from '../components/layout';
import Cup from '../components/cup';
import IFrame from '../components/iFrame';
import NavBar from '../components/nav-bar';
import CSquads from '../models/squads';

const CupTemplate = ({ data }) => {
    const {
        currentTeams: { group: currentTeams },
    } = data;

    const Squads = new CSquads(currentTeams);
    return (
        <Layout.Container title="Cup">
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.Body>
                <Layout.Title>Cup</Layout.Title>
                <Cup Squads={Squads} />
                <IFrame
                    title="Cup Scores"
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQMM8Ec6BQwZgdQOWSl9owH_RrSwQ2cpQbFBeRso1OpQb2YO2Z-OIYHLYy9r6cgxoXTcHogwlsGSVDC/pubhtml"
                />
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query CurrentTeams($gameWeekIndex: Int) {
        currentTeams: allTeams(filter: { gameWeekIndex: { eq: $gameWeekIndex } }, sort: { managerId: ASC }) {
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
                    }
                    hasChanged
                    playerPositionId
                    squadPositionId
                    squadPositionIndex
                    seasonToGameWeek {
                        apps
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        bp
                        sb
                        points
                    }
                    gameWeekStats {
                        apps
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        bp
                        sb
                        points
                    }
                }
            }
        }
    }
`;

export default CupTemplate;
