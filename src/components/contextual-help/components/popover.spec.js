/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import Popover from './Popover';

describe('Popover component', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      header: 'header',
      body: 'body',
    };
    wrapper = mount(
      <Popover {...props} />,
    );
  });

  it('should be defined', () => {
    expect(wrapper).toBeDefined();
  });
});
