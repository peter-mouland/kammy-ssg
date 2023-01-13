import React from 'react';
import { render, screen } from '@testing-library/react';

import Loader from '.';

const { sizes } = Loader;

describe('Loader component', () => {
    it.each`
        size                | className
        ${sizes.TINY}       | ${'isSizeTiny'}
        ${sizes.SMALL}      | ${'isSizeSmall'}
        ${sizes.MEDIUM}     | ${'isSizeMedium'}
        ${sizes.LARGE}      | ${'isSizeLarge'}
        ${sizes.FULL_WIDTH} | ${'isSizeFullWidth'}
    `('should render with correct size class', ({ size, className }) => {
        render(<Loader size={size} />);
        expect(screen.getByTestId('loader')).toHaveClass(className);
    });

    it('should render with animation duration', () => {
        render(<Loader animationDuration="500ms" />);
        expect(screen.getByTestId('loader')).toHaveAttribute('style', 'animation-duration: 500ms;');
    });
});
