import React from 'react';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const PremierLeagueDraft = () => (
    <Layout>
        <TabbedMenu selected="draft" division="premierLeague" label="Premier League" />
        <IFrame
            title="Premier League Draft"
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQr3amNkTAxhpVu1Y1fBhEqDCV0r6J3PBLuNpHlhvmoaJQ7UIfgcOgSd9YKGsTsQfdXzZOLCsJwHnAk/pubhtml?gid=0&single=true"
        />
    </Layout>
);

export default PremierLeagueDraft;
