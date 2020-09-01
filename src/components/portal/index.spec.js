import React from 'react';
import canUseDom from '@clearscore/helpers.can-use-dom';

import Portal from '.';

jest.mock('@clearscore/helpers.can-use-dom', () => jest.fn());

describe('Portal', () => {
    beforeEach(() => {
        canUseDom.mockReset();
    });

    it('should create a portal', () => {
        canUseDom.mockImplementation(() => true);
        const wrapper = shallow(<Portal>hello</Portal>);
        expect(wrapper.find('Portal')).toHaveLength(1);
    });

    it('should remove portal once component dismounts', () => {
        canUseDom.mockImplementation(() => true);
        const spy = jest.fn();
        document.body.removeChild = spy;
        const wrapper = mount(<Portal>hello</Portal>);
        wrapper.unmount();
        expect(spy).toHaveBeenCalled();
    });

    it('should have an optional className', () => {
        canUseDom.mockImplementation(() => true);
        const wrapper = mount(<Portal className="foo">hello</Portal>);
        expect(wrapper.find('.foo')).toHaveLength(1);
    });

    it('should return null if DOM is not loaded', () => {
        canUseDom.mockImplementation(() => false);
        const wrapper = shallow(<Portal>hello</Portal>);
        expect(wrapper).toBeEmptyRender();
    });
});
