import React from 'react';
import PropTypes from 'prop-types';

import Football from './football.svg';
import './interstitial.scss';

const Index = ({ message }) => (
    <span className="interstitial">
        <Football />
        { message || 'Please wait' }...
    </span>
);

Index.propTypes = {
    message: PropTypes.string,
};

Index.defaultProps = {
    message: null,
};

export default Index;
