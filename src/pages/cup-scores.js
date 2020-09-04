import React from 'react';

import IFrame from '../components/iFrame';
import Layout from '../components/layout';

const CupScores = () => (
    <Layout>
        <div data-b-layout="container">
            <IFrame
                title="Cup Scores"
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQMM8Ec6BQwZgdQOWSl9owH_RrSwQ2cpQbFBeRso1OpQb2YO2Z-OIYHLYy9r6cgxoXTcHogwlsGSVDC/pubhtml"
            />
        </div>
    </Layout>
);

export default CupScores;
