/* eslint-disable react/no-deprecated */
import React from 'react';
import PropTypes from 'prop-types';

class CachedOutput extends React.Component {
  componentWillMount() {
    this.context.svgCache.subscribe(() => this.forceUpdate());
  }

  render() {
    const { svgCache = {} } = this.context;
    return (
      <span
        className="sr-only"
        data-ac-svg-cache
        dangerouslySetInnerHTML={{ __html: svgCache.symbols() }}// eslint-disable-line react/no-danger
      />
    );
  }
}

CachedOutput.contextTypes = {
  svgCache: PropTypes.object,
};

export default CachedOutput;
