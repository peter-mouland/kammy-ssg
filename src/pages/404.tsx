import * as React from 'react';

import * as Layout from '../components/layout';

import type { HeadFC, PageProps } from 'gatsby';

const NotFoundPage: React.FC<PageProps> = () => (
    <Layout.Container>
        <Layout.Body>
            <Layout.Title>404 - NOT FOUND</Layout.Title>
            <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
        </Layout.Body>
    </Layout.Container>
);

export default NotFoundPage;

export const Head: HeadFC = () => <title>404 - Not found</title>;
