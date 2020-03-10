import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

const bem = bemHelper({ block: 'error' });

const Index = ({ errors }) => (
  <div className={ bem() }>
    <p>Error!</p>
    {errors.map((error, i) => <p key={i}>{error.message}</p>)}
  </div>
);

Index.propTypes = {
  errors: PropTypes.array.isRequired,
};

export default Index;
