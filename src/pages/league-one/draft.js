import React from 'react';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const LeagueOneDraft = () => (
    <Layout>
        <div data-b-layout="container">
            <TabbedMenu selected="draft" division="leagueOne" label="League One" />
            <IFrame
                title="League One Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTd7NQ2Iu4P7zzjwpHtHwLFacDKTwpmLO08R90fFdYurxEh-LJlYFGjoNM79sPi6iBpV3owLf7mXwOm/pubhtml?gid=0&single=true"
            />
        </div>
    </Layout>
);

export default LeagueOneDraft;
