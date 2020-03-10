/* eslint-env jest */
import React from 'react';
import { shallow, render } from 'enzyme';
import Chance from 'chance';

import Svg, { SvgProvider } from './';

const chance = new Chance();
const svgContent = '<g><line x1="50" y1="50" x2="10" y2="10"/></g>';
const svg = `<svg class="test-svg" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
let cacheId;
const defaultMockProps = {
  id: chance.word(),
  className: chance.word(),
};

describe('Svg', () => {
  beforeEach(() => {
    cacheId = chance.word();
  });
  it('Passes props through', () => {
    const mockProps = Object.assign({}, defaultMockProps, { children: '' });
    const component = shallow(<Svg {...mockProps} >{svg}</Svg>);
    const { className } = component.props();
    expect(className).toContain(defaultMockProps.className);
  });

  it('Passes id props through to the svg', () => {
    const mockProps = Object.assign({}, defaultMockProps, { children: svg });
    const component = render(<Svg {...mockProps} >{svg}</Svg>);
    const svgEl = component.find('svg');
    expect(svgEl[0].attribs.id).toBe(defaultMockProps.id);
  });

  it('renders svg markup as a svg', () => {
    const mockProps = Object.assign({}, defaultMockProps, { children: svg });
    const component = render(<Svg {...mockProps} >{svg}</Svg>);
    const svgs = component.find('svg');
    const imgs = component.find('img');
    expect(svgs).toHaveLength(1);
    expect(imgs).toHaveLength(0);
  });

  it('renders the use tag and correct attr', () => {
    const component = render(<Svg use={defaultMockProps.id}>{svg}</Svg>);
    const use = component.find('use');
    expect(use).toHaveLength(1);
  });

  it('renders the symbol which contains the given id', () => {
    const component = render(<Svg id={defaultMockProps.id} symbol>{svg}</Svg>);
    expect(component.find('symbol').prop('id')).toBe(defaultMockProps.id);
  });

  it('renders the symbol, with the svg not containing an id (as this would confuse the link between the symbol and use tags)', () => {
    const component = render(<Svg id={defaultMockProps.id} symbol>{svg}</Svg>);
    expect(component.find('svg').prop('id')).toBe(undefined);
  });

  it('renders the symbol hidden as symbols should not be seen', () => {
    const component = render(<Svg id={defaultMockProps.id} symbol>{svg}</Svg>);
    expect(component.find('svg').prop('class')).toEqual('sr-only');
  });

  it('renders the use href using xlink (needed for safari)', () => {
    const component = shallow(<Svg use={defaultMockProps.id} >{svg}</Svg>);
    expect(component.html()).toContain(`xlink:href='#${defaultMockProps.id}'`);
  });

  it('renders the height', () => {
    const height = chance.random();
    const component = render(<Svg height={height}>{svg}</Svg>);
    expect(component.find('svg').prop('height')).toEqual(String(height));
  });

  it('renders the width', () => {
    const width = chance.random();
    const component = render(<Svg width={width}>{svg}</Svg>);
    expect(component.find('svg').prop('width')).toEqual(String(width));
  });

  it('renders svg tag when not using a Provider, even if cacheId is given', () => {
    const component = render(<Svg cacheId={cacheId}>{svg}</Svg>);
    expect(component.html()).toEqual(svg);
  });

  it('renders svg tag when using a Provider and cacheId is not given', () => {
    const component = render(<SvgProvider><Svg>{svg}</Svg></SvgProvider>);
    expect(component.html()).toEqual(`<span class="sr-only" data-ac-svg-cache="true"></span><span>${svg}</span>`);
  });
});
