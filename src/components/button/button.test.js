import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { shallow } from 'enzyme';

import Button from '.';

const { types, sizes, themes } = Button;

const requiredProps = {
    children: 'Some text here',
};

describe('Button component', () => {
    it('should render', () => {
        const wrapper = shallow(<Button {...requiredProps} />);
        expect(wrapper).toMatchSnapshot();
    });

    it('should render as anchor tag when href is supplied', () => {
        const href = 'http://www.clearscore.com';
        const wrapper = shallow(<Button {...requiredProps} href={href} />);
        expect(wrapper).toHaveDisplayName('a');
        expect(wrapper.prop('href')).toBe(href);
    });

    it('should render with wide class', () => {
        const wrapper = shallow(<Button {...requiredProps} isWide />);
        expect(wrapper).toHaveClassName('isWide');
    });

    it('should render with narrow class', () => {
        const wrapper = shallow(<Button {...requiredProps} isNarrow />);
        expect(wrapper).toHaveClassName('isNarrow');
    });

    it('should render with flat class', () => {
        const wrapper = shallow(<Button {...requiredProps} isFlat />);
        expect(wrapper).toHaveClassName('isFlat');
    });

    it('should render with responsive class', () => {
        const wrapper = shallow(<Button {...requiredProps} isResponsive />);
        expect(wrapper).toHaveClassName('isResponsive');
    });

    it('should render with disabled class and attribute', () => {
        const wrapper = shallow(<Button {...requiredProps} isDisabled />);
        expect(wrapper).toHaveClassName('isDisabled');
        expect(wrapper.prop('disabled')).toBe(true);
    });

    it('should render when loading as disabled', () => {
        const wrapper = shallow(<Button {...requiredProps} isLoading />);
        expect(wrapper.prop('disabled')).toBe(true);
        expect(wrapper.find('.loader')).toExist();
    });

    it.each`
        type               | className
        ${types.PRIMARY}   | ${'isTypePrimary'}
        ${types.SECONDARY} | ${'isTypeSecondary'}
        ${types.TERTIARY}  | ${'isTypeTertiary'}
        ${types.STICKY}    | ${'isTypeSticky'}
    `('should render $type with $className', ({ type, className }) => {
        const wrapper = shallow(<Button {...requiredProps} type={type} />);
        expect(wrapper).toHaveClassName(className);
    });

    it.each`
        size           | className
        ${sizes.TINY}  | ${'isSizeTiny'}
        ${sizes.SMALL} | ${'isSizeSmall'}
        ${sizes.LARGE} | ${'isSizeLarge'}
    `('should render with correct size class', ({ size, className }) => {
        const wrapper = shallow(<Button {...requiredProps} size={size} />);
        expect(wrapper).toHaveClassName(className);
    });

    it.each`
        theme           | className
        ${themes.LIGHT} | ${'isThemeLight'}
        ${themes.DARK}  | ${'isThemeDark'}
    `('should render with correct theme class', ({ theme, className }) => {
        const wrapper = shallow(<Button {...requiredProps} theme={theme} />);
        expect(wrapper).toHaveClassName(className);
    });

    it.each`
        isDisabled | isLoading | expected
        ${false}   | ${false}  | ${true}
        ${true}    | ${false}  | ${false}
        ${false}   | ${true}   | ${false}
        ${true}    | ${true}   | ${false}
    `('should handle click correctly', ({ isDisabled, isLoading, expected }) => {
        const mock = jest.fn();
        const wrapper = shallow(
            <Button {...requiredProps} isDisabled={isDisabled} isLoading={isLoading} onClick={mock} />,
        );
        const mockClickEvent = new window.Event('click');

        wrapper.simulate('click', mockClickEvent);

        if (expected) expect(mock).toHaveBeenCalledWith(mockClickEvent);
        else expect(mock).not.toHaveBeenCalled();
    });

    it('should have an html type if it has a button tag', () => {
        const htmlType = 'submit';
        const wrapper = shallow(<Button {...requiredProps} htmlType={htmlType} />);
        expect(wrapper).toHaveProp('type', htmlType);
    });

    it('should not have an html type if it has an anchor tag', () => {
        const htmlType = 'submit';
        const wrapper = shallow(<Button {...requiredProps} href="http://foo.bar" htmlType={htmlType} />);
        expect(wrapper).toHaveProp('type', '');
    });

    describe('if href passed to make button an anchor', () => {
        it('should accept newTab for opening in a new tab', () => {
            const wrapper = shallow(<Button {...requiredProps} href="http://foo.bar" newTab />);
            expect(wrapper).toHaveProp('target', '_blank');
        });

        it('should make safe new tab links if newTab passed', () => {
            const wrapper = shallow(<Button {...requiredProps} href="http://foo.bar" newTab />);
            expect(wrapper).toHaveProp('rel', 'noopener noreferrer');
        });

        it('should render a react router link if link is internal', () => {
            const href = '/foo';
            const wrapper = shallow(<Button {...requiredProps} href={href} />);
            expect(wrapper.find(RouterLink)).toHaveProp('to', href);
        });

        it('should render with default data qa', () => {
            const href = '/foo';
            const wrapper = shallow(<Button {...requiredProps} href={href} />);
            expect(wrapper).toHaveProp('data-qa', 'button');
        });

        it('should render dataId prop', () => {
            const href = '/foo';
            const dataId = 'my-data-id';
            const wrapper = shallow(<Button {...requiredProps} dataId={dataId} href={href} />);
            expect(wrapper).toHaveProp('data-id', dataId);
        });

        it('should pass down routerProps to router link', () => {
            const routerProps = { state: 'foo' };
            const wrapper = shallow(<Button {...requiredProps} href="/foo" {...routerProps} />);
            expect(wrapper.find(RouterLink)).toHaveProp('state', 'foo');
        });
    });

    it('should render with default data qa', () => {
        const wrapper = shallow(<Button {...requiredProps} />);
        expect(wrapper).toHaveProp('data-qa', 'button');
    });

    it('should render dataId prop', () => {
        const dataId = 'my-data-id';
        const wrapper = shallow(<Button {...requiredProps} dataId={dataId} />);
        expect(wrapper).toHaveProp('data-id', dataId);
    });

    it('should render name prop', () => {
        const name = 'my-name';
        const wrapper = shallow(<Button {...requiredProps} name={name} />);
        expect(wrapper).toHaveProp('name', name);
    });
});
