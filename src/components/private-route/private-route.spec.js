/* eslint-env jest */
import React from 'react';
import PropTypes from 'prop-types';
import { mount, shallow } from 'enzyme';
import Redirect from 'react-router-dom/Redirect';
import StaticRouter from 'react-router-dom/StaticRouter';

import Index from './';

const fakeLogout = jest.fn();
let auth;

describe('PrivateRoute', () => {
  beforeEach(() => {
    auth = { logout: fakeLogout, validateToken: jest.fn(() => true), user: jest.fn(() => ({})) };
  });

  it('checks user is authenticated if the router requires authentication', () => {
    shallow(<Index component={() => <div /> } path="/" />, { context: { auth } });
    expect(auth.validateToken).toBeCalled();
  });

  it.skip('does a redirect if route requires authentication and user is not authenticated', () => {
    auth.validateToken = jest.fn(() => false);
    const fakeComponent = () => <div />;
    const component = mount(
      <StaticRouter context={{ auth }}><Index path={'/'} component={fakeComponent}/></StaticRouter>,
      {
        context: { auth },
        childContextTypes: { auth: PropTypes.object },
      },
    );
    expect(component.find(Redirect).length).toEqual(1);
    expect(component.find(fakeComponent).length).toEqual(0);
  });

  it('renders a component if route does require authentication and user is authenticated', () => {
    auth.validateToken = jest.fn(() => true);
    const fakeComponent = () => <div />;
    const component = mount((
      <StaticRouter context={{ auth }}>
        <Index path={'/'} component={fakeComponent} />
      </StaticRouter>
    ),
    {
      context: { auth },
      childContextTypes: { auth: PropTypes.object },
    },
    );
    expect(component.find(fakeComponent).length).toEqual(1);
  });
});
