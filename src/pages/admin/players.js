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
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        The purpose of this page is to display the Players stats from the Google Spreadsheet and allow
                        you to copy new player data from SkySports, add see the differences highlighted.
                    </Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>Players In SkySports :{players.length}</Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        Players In Google Spreadsheets :{gSheetPlayers.length}
                    </Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        {gSheetPlayers.length < skyOnlyPlayers.length && (
                            <div>{skyOnlyPlayers.length - gSheetPlayers.length} New Sky Sports players !</div>
                        )}
                    </Spacer>
                    <AdminPlayersTable players={players} />
                </section>
            )}
        </Layout>
    );
};

export default AdminPlayerList;
