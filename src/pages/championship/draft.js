import React from 'react';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const ChampionshipDraft = () => (
    <Layout title="Championship - Draft">
        <div data-b-layout="container">
            <TabbedMenu selected="draft" division="championship" label="Championship" />
            <IFrame
                title="Championship Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTLwqJA5bCMEeBr6N8IUQK-F2Cmx_-O-yBkp6JlnyKiuy08bPWyEEXSJa2ErJgS-OkcMkZgIZGntmB5/pubhtml?gid=0&single=true"
            />
        </div>
    </Layout>
);

export default ChampionshipDraft;
