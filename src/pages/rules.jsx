import React from 'react';

import IFrame from '../components/iFrame';
import * as Layout from '../components/layout';

const Rules = () => (
    <Layout.Container title="Rules">
        <Layout.Body>
            <Layout.Title>Rules</Layout.Title>
            <IFrame
                title="Rules"
                src="https://docs.google.com/document/d/e/2PACX-1vTFlrJtsgbHsNScMLEDyAy1KnSclQmghRXLMdZV7T3L0phP2gp4r71GCzaAGPs6Z4kyw8UvyhD3axmr/pub"
            />
        </Layout.Body>
    </Layout.Container>
);

export default Rules;
