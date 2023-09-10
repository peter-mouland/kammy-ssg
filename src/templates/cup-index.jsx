/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import '@kammy/bootstrap';

import * as Layout from '../components/layout';
import Cup from '../components/cup';
import IFrame from '../components/iFrame';
import Spacer from '../components/spacer';
import NavBar from '../components/nav-bar';

const CupTemplate = ({ data }) => {
    const currentTeams = data.currentTeams.group.reduce(
        (prev, team) => ({
            ...prev,
            [team.nodes[0].managerName]: team.nodes,
        }),
        {},
    );
    return (
        <Layout.Container title="Cup">
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.Body>
                <Layout.Title>Cup</Layout.Title>
                <IFrame
                    title="Cup Scores"
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQMM8Ec6BQwZgdQOWSl9owH_RrSwQ2cpQbFBeRso1OpQb2YO2Z-OIYHLYy9r6cgxoXTcHogwlsGSVDC/pubhtml"
                />
                <Cup currentTeams={currentTeams} />
            </Layout.Body>
        </Layout.Container>
    );
};

export const query = graphql`
    query CurrentTeams($gameWeekIndex: Int) {
        currentTeams: allTeams(filter: { gameWeekIndex: { eq: $gameWeekIndex } }, sort: { managerId: ASC }) {
            group(field: { managerId: SELECT }) {
                nodes {
                    managerId
                    playerPositionId
                    squadPositionId
                    squadPositionIndex
                    player {
                        club
                        name
                        new
                    }
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
                }
            }
        }
    }
`;

export default CupTemplate;
