import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import './toggle.scss';

const bem = bemHelper({ block: 'toggle' });

const Index = ({
  id, checked, label, className, onClick, ...props
}) => (
  <span className={className}>
    <input
      className={ bem(null, 'ios') }
      id={ id }
      type="checkbox"
      defaultChecked={ checked }
      onClick={onClick}
      { ...props }
    />
    <label className={ bem('label') } htmlFor={ id } >
      {label}
      <span className={ bem('btn') } />
    </label>
  </span>
);

Index.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  checked: PropTypes.bool,
};

Index.defaultProps = {
  checked: false,
  className: '',
};

export default Index;
