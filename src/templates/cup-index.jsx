/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import '@kammy/bootstrap';

import Layout from '../components/layout';
import Cup from '../components/cup';
import IFrame from '../components/iFrame';

const CupTemplate = ({ data }) => {
    const currentTeams = data.currentTeams.group.reduce(
        (prev, team) => ({
            ...prev,
            [team.nodes[0].managerName]: team.nodes,
        }),
        {},
    );
    return (
        <Layout title="Cup">
            <section id="cup-page" data-b-layout="container">
                <div data-b-layout="row vpad">Cup</div>
                <IFrame
                    title="Cup Scores"
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQMM8Ec6BQwZgdQOWSl9owH_RrSwQ2cpQbFBeRso1OpQb2YO2Z-OIYHLYy9r6cgxoXTcHogwlsGSVDC/pubhtml"
                />
                <Cup currentTeams={currentTeams} />
            </section>
        </Layout>
    );
};

export const query = graphql`
    query CurrentTeams($gameWeek: Int) {
        currentTeams: allTeams(filter: { gameWeek: { eq: $gameWeek } }, sort: { fields: managerName }) {
            group(field: managerName) {
                nodes {
                    managerName
                    teamPos
                    pos
                    posIndex
                    player {
                        club
                        name: web_name
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
