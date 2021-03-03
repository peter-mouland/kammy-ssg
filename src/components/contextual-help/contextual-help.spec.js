/* eslint-env jest */
/* eslint-disable id-length */
import React from 'react';
import { mount } from 'enzyme';

import ContextualHelp from './';

describe('ContextualHelp component', () => {
  let component;
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      header: 'header',
      body: 'body',
      handleClick: jest.fn(),
    };
    wrapper = mount(
      <ContextualHelp {...props} />,
    );
  });

  describe('defaultProps', () => {
    it('should set the default width to 310', () => {
      expect(ContextualHelp.defaultProps.width).toBe(250);
    });
  });

  describe('default state', () => {
    it('should set isOpen to false', () => {
      expect((new ContextualHelp()).state.isOpen).toBe(false);
    });
  });

  describe('caret', () => {
    it('should set the x prop of caret to as positive value when off the left side of the screen', () => {
      wrapper.setState({ x: -100 });
      const c = wrapper.find('Caret');
      expect(Math.sign(c.props().x)).toBe(1);
    });
    it('should set the x prop of caret to 0 when box is inside the window bounds', () => {
      wrapper.setState({ x: 0 });
      const c = wrapper.find('Caret');
      expect(Math.sign(c.props().x)).toBe(0);
    });
    it('should set the x prop of caret to a negative value when off the right side of screen', () => {
      wrapper.setState({ x: 100 });
      const c = wrapper.find('Caret');
      expect(Math.sign(c.props().x)).toBe(-1);
    });
  });

  describe('close()', () => {
    it('should call setState with isOpen as false and opacity 0', () => {
      const fn = jest.fn();
      component = new ContextualHelp();
      component.setState = jest.fn();
      component.close(fn);
      expect(component.setState).toHaveBeenCalledWith({ isOpen: false, opacity: 0 });
    });
  });

  describe('open()', () => {
    it('should call setState with isOpen as true and opacity 1', () => {
      const fn = jest.fn();
      component = new ContextualHelp();
      component.setState = jest.fn();
      component.open(fn);
      expect(component.setState).toHaveBeenCalledWith({ isOpen: true, opacity: 1 });
    });
  });

  describe('getBoxPosition()', () => {
    it('should return when boxRef is undefined', () => {
      component = new ContextualHelp();
      component.setState = jest.fn();
      component.boxRef = undefined;
      expect(component.getBoxPosition()).toEqual({});
    });

    it('should set a positive x transform when box is outside the left side of viewport', () => {
      window.innerWidth = 1000;
      window.innerHeight = 1000;
      component = new ContextualHelp({ width: 200 });
      component.setState = jest.fn();
      component.boxRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: -100, y: 50, width: 200, height: 100,
        }),
        style: {},
      };
      component.containerRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: 0, y: 0, width: 50, height: 50,
        }),
        style: {},
      };
      expect(component.getBoxPosition()).toEqual({ x: 100, y: 0 });
    });

    it('should set a negative x transform when box is outside the right side of viewport', () => {
      window.innerWidth = 1000;
      window.innerHeight = 1000;
      component = new ContextualHelp({ width: 200 });
      component.setState = jest.fn();
      component.boxRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: 850, y: 50, width: 200, height: 100,
        }),
        style: {},
      };
      component.containerRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: 1000 - 50, y: 0, width: 50, height: 50,
        }),
        style: {},
      };
      expect(component.getBoxPosition()).toEqual({ x: -50, y: 0 });
    });

    it('should set a negative y transform when box is outside viewport bottom', () => {
      window.innerWidth = 1000;
      window.innerHeight = 1000;
      component = new ContextualHelp({ width: 200 });
      component.setState = jest.fn();
      component.boxRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: -100, y: 1000, width: 200, height: 100,
        }),
        style: {},
      };
      component.containerRef = {
        getBoundingClientRect: jest.fn().mockReturnValue({
          x: 0, y: 1000 - 50, width: 50, height: 50,
        }),
        style: {},
      };
      expect(component.getBoxPosition()).toEqual({ x: 100, y: -150 });
    });
  });
});
