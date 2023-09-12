import * as React from 'react';

import IFrame from '../components/iFrame';
import * as Layout from '../components/layout';

import type { HeadFC, PageProps } from 'gatsby';

const PrizeMoney: React.FC<PageProps> = () => (
    <Layout.Container>
        <Layout.Body>
            <Layout.Title>Prize Money</Layout.Title>
            <IFrame
                title="Prize Money"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTc6YcPueOZlY0YNx4W-SbcB2AwoDGfvTa1fxoBuRTmSsxHf61eujyBHkMYrxvjKuLaTbIKoAY97G2B/pubhtml"
            />
        </Layout.Body>
    </Layout.Container>
);

export default PrizeMoney;
export const Head: HeadFC = () => <title>Prize Money</title>;
