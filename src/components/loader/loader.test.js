import React from 'react';
import { shallow } from 'enzyme';

import Loader from '.';

const { sizes } = Loader;

describe('Loader component', () => {
    it('should render', () => {
        const wrapper = shallow(<Loader />);
        expect(wrapper).toMatchSnapshot();
    });

    it.each`
        size                | className
        ${sizes.TINY}       | ${'isSizeTiny'}
        ${sizes.SMALL}      | ${'isSizeSmall'}
        ${sizes.MEDIUM}     | ${'isSizeMedium'}
        ${sizes.LARGE}      | ${'isSizeLarge'}
        ${sizes.FULL_WIDTH} | ${'isSizeFullWidth'}
    `('should render with correct size class', ({ size, className }) => {
        const wrapper = shallow(<Loader size={size} />);
        expect(wrapper).toHaveClassName(className);
    });

    it('should render with default data-qa', () => {
        const wrapper = shallow(<Loader />);
        expect(wrapper).toHaveProp('data-qa', 'loader');
    });

    it('should render with animation duration', () => {
        const wrapper = shallow(<Loader animationDuration="500ms" />);
        expect(wrapper).toHaveProp('style', {
            animationDuration: '500ms',
        });
    });
});
