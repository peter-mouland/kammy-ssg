import React from 'react';

import * as Layout from '../components/layout';

const NotFoundPage = () => (
    <Layout.Container title="404 - page not found">
        <Layout.Body>
            <Layout.Title>NOT FOUND</Layout.Title>
            <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
        </Layout.Body>
    </Layout.Container>
);

export default NotFoundPage;
