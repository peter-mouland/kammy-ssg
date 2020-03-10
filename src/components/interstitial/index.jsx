import React from 'react';
import PropTypes from 'prop-types';

import Svg from '../svg';
import football from './football.svg';
import './interstitial.scss';

const Index = ({ message }) => (
  <span className="interstitial">
    <Svg>{football}</Svg>
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
