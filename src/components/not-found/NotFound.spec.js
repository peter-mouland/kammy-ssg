/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import Index from './';

describe('NotFound', () => {
  it('should render with an id', () => {
    const wrapper = shallow(<Index />);
    expect(wrapper.find('#not-found').length).toEqual(1);
  });
});
