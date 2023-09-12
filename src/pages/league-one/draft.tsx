import * as React from 'react';

import IFrame from '../../components/iFrame';
import * as Layout from '../../components/layout';
import NavBar from '../../components/nav-bar';

import type { HeadFC, PageProps } from 'gatsby';

const LeagueOneDraft: React.FC<PageProps> = () => (
    <Layout.Container>
        <Layout.PrimaryNav>
            <NavBar />
        </Layout.PrimaryNav>
        <Layout.Body>
            <Layout.Title>League One - Draft</Layout.Title>
            <IFrame
                title="League One Draft"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTd7NQ2Iu4P7zzjwpHtHwLFacDKTwpmLO08R90fFdYurxEh-LJlYFGjoNM79sPi6iBpV3owLf7mXwOm/pubhtml?gid=0&single=true"
            />
        </Layout.Body>
        <Layout.Footer />
    </Layout.Container>
);

export default LeagueOneDraft;
export const Head: HeadFC = () => <title>League One - Draft</title>;
