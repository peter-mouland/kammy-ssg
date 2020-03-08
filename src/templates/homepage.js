import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

const Homepage = ({ data }) => {
    console.log(data);
    return (
        <Layout >
            {() => (
              <div>homepage</div>
            )}
        </Layout>
    );
};

//
// export const query = graphql`
//   {}
// `;

export default Homepage;
