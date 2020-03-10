import React from 'react';
import PropTypes from 'prop-types';
import Redirect from 'react-router-dom/Redirect';
import Route from 'react-router-dom/Route';

const Index = ({ component: Component, ...props }, { auth }) => {
  const redirect = !auth.validateToken();
  const pathname = auth.user().mustChangePassword
    ? '/change-password/'
    : '/login';
  return (
    <Route
      {...props} render={(matchProps) => (
        redirect
          ? <Redirect to={{ pathname, state: { from: matchProps.location } }}/>
          : <Component {...matchProps}/>
      )}/>
  );
};

Index.propTypes = {
  component: PropTypes.func.isRequired,
};

Index.contextTypes = {
  auth: PropTypes.object.isRequired,
};

export default Index;
