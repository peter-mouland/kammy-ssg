import React from 'react';

import Spacer from './spacer';

const { spacings } = Spacer;

const render = ({ props = {} } = {}) => ({ wrapper: mount(<Spacer {...props} />) });

describe('<Space />', () => {
    describe('default:', () => {
        it('renders a div', () => {
            const { wrapper } = render();
            expect(wrapper.find('div')).toHaveLength(1);
        });
    });

    describe('className:', () => {
        it('does add any given class', () => {
            const { wrapper } = render({ props: { className: 'test' } });
            expect(wrapper.find('div')).toHaveClassName('test');
        });
    });

    describe('tag: ', () => {
        it('renders a ul if a tag=ul is passed', () => {
            const { wrapper } = render({ props: { tag: 'ul' } });
            expect(wrapper.find('div')).toHaveLength(0);
            expect(wrapper.find('ul')).toHaveLength(1);
        });
    });

    describe('other props: ', () => {
        it('renders dataId attr', () => {
            const { wrapper } = render({ props: { dataId: 'data' } });
            expect(wrapper.find('div')).toHaveProp('data-id', 'data');
        });
    });

    describe('breakpoints prop: ', () => {
        describe('all screens: ', () => {
            it.each(Object.values(spacings))('adds class: top-%s', (spacingSize) => {
                const { wrapper } = render({
                    props: { all: { top: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `top-${spacingSize}`);
            });
            it.each(Object.values(spacings))('adds class: vertical-%s', (spacingSize) => {
                const { wrapper } = render({
                    props: { all: { vertical: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `vertical-${spacingSize}`);
            });
        });

        describe('small screens: ', () => {
            it.each(Object.values(spacings))('adds horizontal class with spacing %s', (spacingSize) => {
                const { wrapper } = render({
                    props: { small: { horizontal: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `horizontal-${spacingSize}@small`);
            });
        });

        describe('phablet screens: ', () => {
            it.each(Object.values(spacings))('adds bottom class with spacing %s', (spacingSize) => {
                const { wrapper } = render({
                    props: { phablet: { bottom: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `bottom-${spacingSize}@phablet`);
            });
        });

        describe('medium screens: ', () => {
            it.each(Object.values(spacings))('adds left class with spacing %s', (spacingSize) => {
                const { wrapper } = render({
                    props: { medium: { left: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `left-${spacingSize}@medium`);
            });
        });

        describe('large screens: ', () => {
            it.each(Object.values(spacings))('adds right class with spacing %s', (spacingSize) => {
                const { wrapper } = render({
                    props: { large: { right: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `right-${spacingSize}@large`);
            });
        });

        describe('huge screens: ', () => {
            it.each(Object.values(spacings))('adds stack class with spacing %s', (spacingSize) => {
                const { wrapper } = render({
                    props: { huge: { stack: spacingSize } },
                });
                expect(wrapper.find('div')).toHaveProp('className', `stack-${spacingSize}@huge`);
            });
        });

        describe('combo: ', () => {
            it('add multiple class names', () => {
                const { wrapper } = render({
                    props: {
                        all: { top: spacings.MICRO },
                        small: { top: spacings.TINY },
                        phablet: { bottom: spacings.SMALL },
                        medium: { bottom: spacings.MEDIUM },
                        large: { right: spacings.LARGE },
                        huge: { right: spacings.BIG },
                    },
                });
                expect(wrapper.find('div')).toHaveProp(
                    'className',
                    'top-micro top-tiny@small bottom-small@phablet bottom-medium@medium right-large@large right-big@huge',
                );
            });
        });
    });
});
