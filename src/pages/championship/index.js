import React from 'react';
import PropTypes from 'prop-types';

import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';

const Index = () => (
    <Layout>
        <div data-b-layout="container">
            <TabbedMenu division={'championship'} />
        </div>
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
