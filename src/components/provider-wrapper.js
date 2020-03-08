// config *must* run before everything else
/* eslint-disable */
import "../config/config";
/* eslint-enable */

import React  from 'react';
import PropTypes from 'prop-types';

const ProviderWrapper = ({ element }) => (
    <div>
        {element}
    </div>
);

ProviderWrapper.propTypes = {
    element: PropTypes.node.isRequired,
};

export default ProviderWrapper;
