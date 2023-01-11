import React from 'react';

import Layout from '../../components/layout';
import Spacer from '../../components/spacer';

const AdminPlayerList = () => (
    <Layout title="Admin - Transfers List" description="">
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
export default AdminPlayerList;
