// config *must* run before everything else
/* eslint-disable */
import "../config/config";
/* eslint-enable */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import './index.css';

const Layout = ({ children }) => {
    return (
        <Fragment>
            {typeof children === 'function' ? children() : children}
        </Fragment>
    );
};

Layout.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
};

export default Layout;
