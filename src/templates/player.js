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
            name
            club
            pos
            new
            isHidden
            isAvailable
            avail
            availStatus
            availReason
            availNews
            returnDate
            url
            season {
                apps
                subs
                gls
                asts
                cs
                con
                pensv
                ycard
                rcard
                tb
                pb
                sb
                points
            }
            gameWeeks {
                fixtures {
                    id
                    aScore
                    aTcode
                    aTname
                    week
                    status
                    stats {
                        apps
                        asts
                        con
                        cs
                        pensv
                        gls
                        points
                        rcard
                        pb
                        tb
                        sb
                        subs
                        ycard
                    }
                    pTcode
                    hTname
                    hTcode
                    hScore
                    event
                    date
                }
            }
        }
    }
`;

export default PlayerPage;
