import * as React from 'react';

import IFrame from '../../components/iFrame';
import * as Layout from '../../components/layout';
import NavBar from '../../components/nav-bar';

import type { HeadFC, PageProps } from 'gatsby';

const PremierLeagueDraft: React.FC<PageProps> = () => (
    <Layout.Container>
        <Layout.PrimaryNav>
            <NavBar />
        </Layout.PrimaryNav>
        <Layout.Body>
            <Layout.Title>Premier League - Draft</Layout.Title>
            <IFrame
                title="Premier League Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQr3amNkTAxhpVu1Y1fBhEqDCV0r6J3PBLuNpHlhvmoaJQ7UIfgcOgSd9YKGsTsQfdXzZOLCsJwHnAk/pubhtml?gid=0&single=true"
            />
        </Layout.Body>
        <Layout.Footer />
    </Layout.Container>
);

export default PremierLeagueDraft;
export const Head: HeadFC = () => <title>Premier League - Draft</title>;
