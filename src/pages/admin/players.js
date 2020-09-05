import React from 'react';

import Layout from '../../components/layout';
import Spacer from '../../components/spacer';
import usePlayers from '../../hooks/use-admin-players';
import AdminPlayersTable from '../../components/admin-players-table';

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const AdminPlayerList = () => {
    const { players, gSheetPlayers, live } = usePlayers();
    const livePlayers = live.skyPlayers
        .map((skyPlayer) => {
            const name = `${skyPlayer.sName}, ${skyPlayer.fName}`.trim();
            const googlePlayer = live.gSheetPlayers.find(({ Player = '' } = {}) => Player.trim() === name);
            const gResponse = googlePlayer
                ? {
                      isHidden: ['hidden', 'y', 'Y'].includes(googlePlayer.isHidden),
                      new: ['new', 'y', 'Y'].includes(googlePlayer.new),
                      code: parseInt(googlePlayer.Code, 10),
                      club: googlePlayer.Club,
                      pos: googlePlayer.Pos.toUpperCase(), // Pos = dff pos, Position = ss pos
                      name: googlePlayer.Player.trim(),
                  }
                : {};
            const skyResponse = {
                ...skyPlayer,
                skySportsPosition: skyPlayer.group.toUpperCase(),
                name,
                code: parseInt(skyPlayer.id, 10),
                club: toTitleCase(skyPlayer.tName),
                value: parseFloat(skyPlayer.value),
                player: {},
            };
            return {
                ...skyResponse,
                ...gResponse,
            };
        })
        .filter(Boolean);

    return (
        <Layout meta={{ title: 'Admin Players List', description: '' }}>
            <section id="admin-page" data-b-layout="container">
                <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                    <h1>Admin Players</h1>
                </Spacer>
                <section>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        Players In SkySports (live) :{live.skyPlayers.length}
                    </Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        Players In Google Spreadsheets (live) :{live.gSheetPlayers.length}
                    </Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        Players In Google Spreadsheets (published) :{gSheetPlayers.length}
                    </Spacer>
                    <Spacer all={{ top: Spacer.spacings.MEDIUM, bottom: Spacer.spacings.TINY }}>
                        {gSheetPlayers.length !== live.gSheetPlayers.length && (
                            <div>
                                GoogleSheet SpreadSheet has changed since last publish!{' '}
                                {gSheetPlayers.length - live.gSheetPlayers.length} player(s)
                            </div>
                        )}
                    </Spacer>
                    <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                        {players.length !== live.skyPlayers.length && (
                            <div>
                                Sky Player list has changed since last publish!{' '}
                                {players.length - live.skyPlayers.length} player(s)
                            </div>
                        )}
                    </Spacer>
                </section>
                <Spacer all={{ top: Spacer.spacings.LARGE }}>
                    <h3>This table uses the LIVE data, not the published data.</h3>
                    <AdminPlayersTable players={livePlayers} />
                </Spacer>
            </section>
        </Layout>
    );
};

export default AdminPlayerList;
