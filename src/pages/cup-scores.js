import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../components/iFrame';
import Layout from '../components/layout';

const Index = () => (
    <Layout>
        <IFrame src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSWyi5ZU1jMBPmpLMJzKlZ0aA71HJk7h3Fh4p-rS6e9rw_4lymyetJsYwlaB4iMTlLQPiUYiWwfgt1n/pubhtml" />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
