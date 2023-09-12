import * as React from 'react';

import IFrame from '../../components/iFrame';
import * as Layout from '../../components/layout';
import NavBar from '../../components/nav-bar';

import type { HeadFC, PageProps } from 'gatsby';

const ChampionshipDraft: React.FC<PageProps> = () => (
    <Layout.Container>
        <Layout.PrimaryNav>
            <NavBar />
        </Layout.PrimaryNav>
        <Layout.Body>
            <Layout.Title>Championship - Draft</Layout.Title>
            <IFrame
                title="Championship Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTLwqJA5bCMEeBr6N8IUQK-F2Cmx_-O-yBkp6JlnyKiuy08bPWyEEXSJa2ErJgS-OkcMkZgIZGntmB5/pubhtml?gid=0&single=true"
            />
        </Layout.Body>
        <Layout.Footer />
    </Layout.Container>
);

export default ChampionshipDraft;
export const Head: HeadFC = () => <title>Championship - Draft</title>;
