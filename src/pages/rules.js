import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../components/iFrame';
import Layout from '../components/layout';

const Index = () => (
    <Layout>
        <IFrame src="https://docs.google.com/document/d/e/2PACX-1vTFlrJtsgbHsNScMLEDyAy1KnSclQmghRXLMdZV7T3L0phP2gp4r71GCzaAGPs6Z4kyw8UvyhD3axmr/pub" />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
