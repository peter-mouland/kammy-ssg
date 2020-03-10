/* eslint-env jest */
import React from 'react';
import { render } from 'enzyme';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import AppConfigProvider from '@kammy-ui/app-config-provider';

import NavBar from './';

describe('<NavBar />', () => {
  it('renders a nav', () => {
    const wrapper = render(
      <AppConfigProvider>
        <BrowserRouter>
          <NavBar/>
        </BrowserRouter>
      </AppConfigProvider>,
    );
    expect(wrapper.find('nav')).toHaveLength(1);
  });
});
