import React from 'react';
import PropTypes from 'prop-types';

import IFrame from '../../components/iFrame';
import Layout from '../../components/layout';
import TabbedMenu from '../../components/tabbed-division-menu';
import Spacer from '../../components/spacer';

const Index = () => (
    <Layout>
        <div data-b-layout="container">
            <Spacer all={{ bottom: Spacer.spacings.MEDIUM, top: Spacer.spacings.LARGE }}>
                <h1>Championship: Draft</h1>
            </Spacer>
            <TabbedMenu selected="draft" division={'championship'} />
        </div>
        <IFrame src='https://docs.google.com/spreadsheets/d/e/2PACX-1vTLwqJA5bCMEeBr6N8IUQK-F2Cmx_-O-yBkp6JlnyKiuy08bPWyEEXSJa2ErJgS-OkcMkZgIZGntmB5/pubhtml?gid=0&single=true' />
    </Layout>
);

Index.propTypes = {
    src: PropTypes.string.isRequired,
};

export default Index;
