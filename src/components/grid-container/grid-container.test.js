import React from 'react';

import GridContainer from '.';

const setupTest = (requiredProps) => mount(<GridContainer {...requiredProps} />);

describe('grid-container', () => {
    const requiredProps = {
        children: <div className="test" />,
    };
    describe('default', () => {
        it('should render', () => {
            const wrapper = setupTest(requiredProps);
            expect(wrapper.find('.test')).toHaveLength(1);
            expect(wrapper.find('.fullWidth')).toHaveLength(0);
        });
    });
    describe('custom', () => {
        it('should render full width', () => {
            const wrapper = setupTest({ isFullWidth: true, ...requiredProps });
            expect(wrapper.find('.fullWidth')).toHaveLength(1);
        });
    });
});
