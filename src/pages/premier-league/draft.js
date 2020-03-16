import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';

const Index = () => (
    <Layout>
        <IFrame src='https://docs.google.com/spreadsheets/d/e/2PACX-1vQr3amNkTAxhpVu1Y1fBhEqDCV0r6J3PBLuNpHlhvmoaJQ7UIfgcOgSd9YKGsTsQfdXzZOLCsJwHnAk/pubhtml?gid=0&single=true' />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
