/* eslint-env jest */
import React from 'react';
import { shallow, render } from 'enzyme';
import Chance from 'chance';

import Index from './';

const chance = new Chance();
const defaultMockProps = {
  className: chance.word(),
  label: chance.word(),
  id: chance.word(),
  onClick: jest.fn(),
};

describe('Toggle', () => {
  it('Passes className through', () => {
    const component = shallow(<Index {...defaultMockProps} />);
    const { className } = component.props();
    expect(className).toContain(defaultMockProps.className);
  });

  it('Passes onClick through', () => {
    const component = shallow(<Index {...defaultMockProps} />);

    component.find('input').simulate('click');
    expect(defaultMockProps.onClick.mock.calls.length).toEqual(1);
  });

  describe('accessibility', () => {
    it('Passes id props through to the input', () => {
      const mockProps = Object.assign({}, defaultMockProps);
      const component = render(<Index {...mockProps} />);
      const el = component.find('input');
      expect(el[0].attribs.id).toBe(defaultMockProps.id);
    });

    it('Passes id props through to the label', () => {
      const mockProps = Object.assign({}, defaultMockProps);
      const component = render(<Index {...mockProps} />);
      const el = component.find('label');
      expect(el[0].attribs.for).toBe(defaultMockProps.id);
    });
  });
});
