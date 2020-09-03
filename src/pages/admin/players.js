import React from 'react';

import Layout from '../../components/layout';
import Spacer from '../../components/spacer';
import usePlayers from '../../hooks/use-admin-players';
import AdminPlayersTable from '../../components/admin-players-table';

const AdminPlayerList = () => {
    const { players, gSheetPlayers, skyOnlyPlayers } = usePlayers();
    return (
        <Layout meta={{ title: 'Admin Players List', description: '' }}>
            {() => (
                <section id="admin-page" data-b-layout="container">
                    <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                        <h1>Admin Players</h1>
                    </Spacer>
                    <p>
                        The purpose of this page is to display the Players stats from the Google Spreadsheet and allow
                        you to copy new player data from SkySports, add see the differences highlighted.
                    </p>
                    <p>Players In SkySports :{skyOnlyPlayers.length}</p>
                    <p>Players In Google Spreadsheets :{gSheetPlayers.length}</p>
                    <p>
                        {gSheetPlayers.length < skyOnlyPlayers.length && (
                            <div>{skyOnlyPlayers.length - gSheetPlayers.length} New Sky Sports players !</div>
                        )}
                    </p>
                    <AdminPlayersTable players={players} />
                </section>
            )}
        </Layout>
    );
};

export default AdminPlayerList;
