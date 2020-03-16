import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../components/iFrame';
import Layout from '../components/layout';

const Index = () => (
    <Layout>
        <IFrame src='https://docs.google.com/spreadsheets/d/e/2PACX-1vTc6YcPueOZlY0YNx4W-SbcB2AwoDGfvTa1fxoBuRTmSsxHf61eujyBHkMYrxvjKuLaTbIKoAY97G2B/pubhtml' />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
