/* global spyOn */
/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';
import Chance from 'chance';

import CachedOutput from './CachedOutput';

const chance = new Chance();
let Symbol;
let context;

describe('CachedOutput', () => {
  beforeEach(() => {
    Symbol = chance.word();
    context = {
      svgCache: {
        subscribe: jest.fn(),
        symbols: jest.fn(),
      },
    };
  });

  it('calls componentWillMount to ensure server-side rendering is solid + the subscription service is added to before mount (i.e. componentDidMount is too late)', () => {
    spyOn(CachedOutput.prototype, 'componentWillMount').and.callThrough();

    const component = mount(<CachedOutput />, { context });
    expect(component).toBeDefined();
    expect(CachedOutput.prototype.componentWillMount).toHaveBeenCalledTimes(1);
    expect(context.svgCache.subscribe).toHaveBeenCalledTimes(1);
  });

  it('calls symbols', () => {
    mount(<CachedOutput />, { context });
    expect(context.svgCache.symbols).toHaveBeenCalledTimes(1);
  });

  it('outputs the result of symbol', () => {
    context.svgCache.symbols.mockReturnValue(Symbol);
    const component = mount(<CachedOutput />, { context });
    expect(component.html()).toBe(`<span class="sr-only" data-ac-svg-cache="true">${Symbol}</span>`);
  });
});
