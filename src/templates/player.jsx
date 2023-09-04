/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';

import Layout from '../components/layout';
import PlayerTimeline from '../components/division-teams/components/PlayerTimeline.table';

const bemTable = bemHelper({ block: 'players-page-table' });

const PlayerPage = ({ data, pageContext: { playerName } }) => {
    const player = data.players;

    return (
        <Layout title={playerName}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <div className="page-content">
                    <PlayerTimeline player={player} />
                </div>
            </section>
        </Layout>
    );
};

export const query = graphql`
    query Player($code: Int) {
        players(code: { eq: $code }) {
            id
            code
            name: web_name
            club
            pos
            new
            isHidden
            url
            season {
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
            gameWeeks {
                fixtures {
                    aScore
                    aTcode
                    aTname
                    aTshortName
                    hScore
                    hTcode
                    hTname
                    hTshortName
                    # week
                    # status
                    is_home
                    was_home
                    team_h_score
                    team_a_score
                    # event
                    date
                    stats {
                        apps
                        gls
                        asts
                        cs
                        con
                        pensv
                        ycard
                        rcard
                        sb
                        bp
                        points
                    }
                }
            }
        }
    }
`;

export default PlayerPage;
