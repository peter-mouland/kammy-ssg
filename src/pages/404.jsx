import React from 'react';

import Layout from '../components/layout';

const NotFoundPage = () => (
    <Layout title="404 - page not found">
        <div id="404-page" data-b-layout="container">
            <h1>NOT FOUND</h1>
            <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
        </div>
    </Layout>
);

export default NotFoundPage;
