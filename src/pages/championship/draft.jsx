import React from 'react';

import IFrame from '../../components/iFrame';
import * as Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const ChampionshipDraft = () => (
    <Layout.Container title="Championship - Draft">
        <Layout.Body>
            <Layout.Title>Championship - Draft</Layout.Title>
            <TabbedMenu selected="draft" divisionId="championship" label="Championship" />
            <IFrame
                title="Championship Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTLwqJA5bCMEeBr6N8IUQK-F2Cmx_-O-yBkp6JlnyKiuy08bPWyEEXSJa2ErJgS-OkcMkZgIZGntmB5/pubhtml?gid=0&single=true"
            />
        </Layout.Body>
    </Layout.Container>
);

export default ChampionshipDraft;
