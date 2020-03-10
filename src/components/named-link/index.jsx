import React from 'react';
import PropTypes from 'prop-types';
import Route from 'react-router-dom/Route';
import Link from 'react-router-dom/Link';
import bemHelper from '@kammy/bem';


const bem = bemHelper({ block: 'named-link' });

const findRoute = ({ appConfig, to }) => appConfig.routes.find((rt) => rt.name === to);

const Index = ({ className, to }, { appConfig }) => {
  const route = findRoute({ to, appConfig });
  if (!route) throw new Error(`Route to '${to}' not found`);
  const { path, label } = route;
  return (
    <Route path={ path }>
      {({ match }) => (
        <Link to={ path } className={ bem(null, { active: match }, className) }>
          { label }
        </Link>
      )}
    </Route>
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
