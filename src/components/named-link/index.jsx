import React from 'react';
import PropTypes from 'prop-types';
import Link from 'gatsby-link';
import bemHelper from '@kammy/bem';

import appConfig from '../../config/config';

const bem = bemHelper({ block: 'named-link' });

const findRoute = ({ to }) => appConfig.routes.find((rt) => rt.name === to);

const Index = ({ className, to }) => {
  const route = findRoute({ to });
  if (!route) throw new Error(`Route to '${to}' not found`);
  const { path, label } = route;
  return (
      <Link to={ path } className={ bem(null, null , className) }>
        { label }
      </Link>
  );
};

Index.propTypes = {
  to: PropTypes.string.isRequired,
  className: PropTypes.string,
};

Index.contextTypes = {
  appConfig: PropTypes.object,
};

export default Index;
