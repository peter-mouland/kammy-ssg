import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import ContextualHelp from '../contextual-help';
import Interstitial from '../interstitial';
import './multi-toggle.scss';

const bem = bemHelper({ block: 'multi-toggle' });

const Index = ({
  id, checked, options, disabledOptions, label, loadingMessage, className, onChange, contextualHelp, loading, ...props
}) => (
  <span className={bem(null, null, className)} id={ id } { ...props }>
    {label && <span className={bem('label')}>{label}</span>}
    <span className={bem('group')} id={ id } { ...props }>
      {loading && <div className={bem('interstitial')}><Interstitial message={loadingMessage}/></div>}
      {options.map((option, i) => (
        <div className={ bem('option') } key={ `${id}-${i}` }>
          <input
            checked={checked === option}
            id={ `${id}-${i}` }
            name={ id }
            type={'radio'}
            value={option}
            onChange={disabledOptions.includes(option) ? null : () => onChange(option)}
            disabled={disabledOptions.includes(option)}
          />
          {contextualHelp && (
            <ContextualHelp body={contextualHelp(option)} Trigger={(
              <label className={ bem('option-label') } htmlFor={ `${id}-${i}` }>{option}</label>
            )}/>
          )}
          {!contextualHelp && (
            <label className={ bem('option-label') } htmlFor={ `${id}-${i}` }>{option}</label>
          )}
        </div>
      ))
      }
    </span>
  </span>
);

Index.propTypes = {
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  disabledOptions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  className: PropTypes.string,
  checked: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  loadingMessage: PropTypes.string,
  loading: PropTypes.bool,
  contextualHelp: PropTypes.func,
};

Index.defaultProps = {
  disabledOptions: [],
  options: [],
  checked: null,
  loading: false,
  loadingMessage: null,
  label: null,
  contextualHelp: null,
};

export default Index;
