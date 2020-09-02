import React from 'react';

import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const ChampionshipIndex = () => (
    <Layout>
        <div data-b-layout="container">
            <TabbedMenu division="championship" />
        </div>
    </Layout>
);

export default ChampionshipIndex;
