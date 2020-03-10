import React from 'react';
import PropTypes from 'prop-types';
import Cache from './Cache';
import CachedOutput from './CachedOutput';

class SvgProvider extends React.Component {
  constructor(props, state) {
    super(props, state);
    this.svgCache = new Cache();
  }

  getChildContext() {
    return { svgCache: this.svgCache };
  }

  render() {
    return (
      <div>
        <CachedOutput />
        {this.props.children}
      </div>
    );
  }
}

SvgProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.element, PropTypes.string]).isRequired,
};

SvgProvider.childContextTypes = {
  svgCache: PropTypes.object,
};

export default SvgProvider;
