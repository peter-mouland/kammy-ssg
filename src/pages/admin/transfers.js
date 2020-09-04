import React from 'react';

import Layout from '../../components/layout';
import Spacer from '../../components/spacer';
// import useTransfers from '../../hooks/use-transfers';

const AdminPlayerList = () => {
    // const { isLoading, saveTransfer, isSaving, transfersThisGameWeek } = useTransfers({ divisionKey });
    return (
        <Layout meta={{ title: 'Admin Transfers List', description: '' }}>
            <section id="admin-page" data-b-layout="container">
                <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                    <h1>Admin Transfers</h1>
                </Spacer>
                <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                    The purpose of this page is to allow transfers to be accepted or rejected
                </Spacer>

            </section>
        </Layout>
    );
};

export default AdminPlayerList;
