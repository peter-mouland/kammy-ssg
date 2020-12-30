/* eslint-disable react/prop-types */
import React from 'react';
import { graphql } from 'gatsby';
import bemHelper from '@kammy/bem';
import { useTable, useSortBy } from 'react-table';

import { PlayersFilters, PlayersTable } from '../components/players-table';
import useLiveScores from '../hooks/use-live-scores';
import Layout from '../components/layout';
import TabbedMenu from '../components/tabbed-division-menu';
import Player from '../components/player';

const bemTable = bemHelper({ block: 'players-page-table' });
const positions = ['GK', 'CB', 'FB', 'MID', 'AM', 'STR'];
const hiddenColumns = ['isHidden', 'isAvailable', 'new', 'value', 'code'];
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

const PlayersPage = ({ data, pageContext: { divisionKey, divisionLabel } }) => {
    const { liveStatsByCode } = useLiveScores();
    const players = data.allPlayers.nodes;
    const disabledPlayers = data.teamPlayers.nodes.reduce(
        (prev, player) => ({
            ...prev,
            [player.playerName]: player,
        }),
        {},
    );
    const tableData = React.useMemo(() => players, []);
    const tableColumns = React.useMemo(
        () => [
            {
                Header: 'Player',
                accessor: 'name',
                Cell: ({ row }) => (
                    <Player
                        player={{
                            isAvailable: row.original.isAvailable,
                            availReason: row.original.availReason,
                            availStatus: row.original.availStatus,
                            availNews: row.original.availNews,
                            returnDate: row.original.returnDate,
                            code: row.original.code,
                            club: row.original.club,
                            url: row.original.url,
                            pos: row.original.pos,
                            name: row.original.name,
                        }}
                    />
                ),
            },
            {
                Header: 'points',
                accessor: 'season.points',
                orderByFn: (a, b) => (parseInt(a, 10) < parseInt(b, 10) ? -1 : 1),
            },
            {
                Header: 'apps',
                accessor: 'season.apps',
            },
            {
                Header: 'subs',
                accessor: 'season.subs',
            },
            {
                Header: 'gls',
                accessor: 'season.gls',
            },
            {
                Header: 'asts',
                accessor: 'season.asts',
            },
            {
                Header: 'cs',
                accessor: 'season.cs',
            },
            {
                Header: 'con',
                accessor: 'season.con',
            },
            {
                Header: 'pensv',
                accessor: 'season.pensv',
            },
            {
                Header: 'pb',
                accessor: 'season.pb',
            },
            {
                Header: 'tb',
                accessor: 'season.tb',
            },
            {
                Header: 'sb',
                accessor: 'season.sb',
            },
            {
                Header: 'ycard',
                accessor: 'season.ycard',
            },
            {
                Header: 'rcard',
                accessor: 'season.rcard',
            },
        ],
        [],
    );
    const tableInstance = useTable({ columns: tableColumns, data: tableData }, useSortBy);
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    return (
        <Layout title={`${divisionLabel} - Players`}>
            <section id="players-page" className={bemTable()} data-b-layout="container">
                <TabbedMenu selected="players" division={divisionKey} />
                <div className="page-content">
                    <table {...getTableProps()} style={{ margin: '0 auto' }}>
                        <thead>
                            {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map((column) => (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            style={{
                                                padding: '4px 2px',
                                                borderTop: 'solid 1px #ccc',
                                                borderBottom: 'solid 1px #ccc',
                                                textAlign: 'center',
                                                background: 'aliceblue',
                                                color: '#444',
                                                fontWeight: 'bold',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {column.render('Header')}
                                            <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()} style={{ color: '#444' }}>
                            {rows.map((row) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map((cell) => (
                                            <td
                                                {...cell.getCellProps()}
                                                style={{
                                                    padding: '10px',
                                                    textAlign: 'center',
                                                    borderBottom: 'solid 1px #ccc',
                                                    background: 'white',
                                                }}
                                            >
                                                {cell.render('Cell')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </Layout>
    );
};

export const query = graphql`
    query AllPlayers($gameWeek: Int, $divisionKey: String) {
        teamPlayers: allTeams(filter: { gameWeek: { eq: $gameWeek }, manager: { divisionKey: { eq: $divisionKey } } }) {
            nodes {
                managerName
                playerName
            }
        }
        allPlayers(filter: { isHidden: { eq: false } }) {
            nodes {
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
            }
        }
    }
`;

export default PlayersPage;
