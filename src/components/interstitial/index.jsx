import React from 'react';
import PropTypes from 'prop-types';

import Football from './football.svg';
import './interstitial.scss';

const Interstitial = ({ message }) => (
    <span className="interstitial">
        <Football />
        {message || 'Please wait'}...
    </span>
);

Interstitial.propTypes = {
    message: PropTypes.string,
};

Interstitial.defaultProps = {
    message: null,
};

export default Interstitial;
