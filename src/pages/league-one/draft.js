import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';

const Index = () => (
    <Layout>
        <IFrame src='https://docs.google.com/spreadsheets/d/e/2PACX-1vTd7NQ2Iu4P7zzjwpHtHwLFacDKTwpmLO08R90fFdYurxEh-LJlYFGjoNM79sPi6iBpV3owLf7mXwOm/pubhtml?gid=0&single=true' />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;