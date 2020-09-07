/* eslint-disable react/prop-types */
import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import bemHelper from '@kammy/bem';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import Layout from '../components/layout';

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'value', 'code'];
const visibleStats = [
    'points',
    'apps',
    'subs',
    'gls',
    'asts',
    'cs',
    'con',
    'pensv',
    'pb',
    'tb',
    'sb',
    'ycard',
    'rcard',
];

const PlayersPage = () => {
    const {
        allPlayers1920: { nodes: players },
    } = useStaticQuery(graphql`
        query AllPlayers1920 {
            allPlayers1920(filter: { isHidden: { eq: false } }) {
                nodes {
                    id
                    name
                    club
                    pos
                    new
                    isHidden
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
                }
            }
        }
    `);
    return (
        <Layout>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <div className="page-content">
                    <PlayersFilters players={players} positions={positions}>
                        {(playersFiltered) => (
                            <PlayersTable
                                positions={positions}
                                players={playersFiltered}
                                disabledPlayers={{}}
                                hiddenColumns={hiddenColumns}
                                visibleStats={visibleStats}
                            />
                        )}
                    </PlayersFilters>
                </div>
            </section>
        </Layout>
    );
};

export default PlayersPage;
