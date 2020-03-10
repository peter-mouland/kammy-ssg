/* eslint-env jest */
import React from 'react';
import { shallow, render } from 'enzyme';
import Chance from 'chance';

import SvgProvider from './Provider';
import CachedOutput from './CachedOutput';

const chance = new Chance();

let children;
let context;

describe('Provider', () => {
  beforeEach(() => {
    children = chance.word();
    context = {
      svgCache: {
        subscribe: jest.fn(),
        symbols: jest.fn(),
      },
    };
  });

  it('Passes props through', () => {
    const component = shallow(<SvgProvider>{children}</SvgProvider>);
    expect(component).toBeDefined();
  });

  it('Create a new cache which gets saved on to the context', () => {
    const component = shallow(<SvgProvider>{children}</SvgProvider>);
    const wrapperInstance = component.instance();
    expect(wrapperInstance.svgCache).toBeDefined();
  });

  it('calls the svgCache component', () => {
    const component = shallow(<SvgProvider>{children}</SvgProvider>);
    expect(component.find(CachedOutput)).toHaveLength(1);
  });

  it('renders svgCache BEFORE the children (this is to ensure subscriptions are setup before anything renders)', () => {
    const component = render(<SvgProvider>{children}</SvgProvider>, { context });
    expect(component.html()).toBe(`<span class="sr-only" data-ac-svg-cache="true"></span>${children}`);
  });
});
