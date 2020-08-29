import React from 'react';
import { act } from 'react-dom/test-utils';

import Drawer from '.';

const requiredProps = {
    children: 'drawer',
};

const setupTest = (props) => mount(<Drawer {...requiredProps} {...props} />);

describe('drawer', () => {
    describe('default', () => {
        let wrapper;

        beforeEach(() => {
            wrapper = setupTest();
        });

        it('should have close button with data-qa', () => {
            expect(wrapper.find('button')).toHaveLength(1);
            expect(wrapper.find('button')).toHaveProp('data-qa', 'drawer-close-button');
        });

        it('should not be visible', () => {
            expect(wrapper.find('[data-qa="drawer"]')).not.toHaveClassName('isOpen');
        });

        it('should not have backdrop', () => {
            expect(wrapper.find('[data-qa="backdrop"]')).not.toHaveClassName('isShown');
        });
    });

    describe('props', () => {
        it('should render children', () => {
            const wrapper = setupTest({ children: 'lol' });
            expect(wrapper.find('[data-qa="drawer"] div').text()).toBe('lol');
        });

        it.each`
            placement                   | className
            ${Drawer.placements.RIGHT}  | ${'isRight'}
            ${Drawer.placements.BOTTOM} | ${'isBottom'}
            ${Drawer.placements.LEFT}   | ${'isLeft'}
        `('should render placement', ({ placement, className }) => {
            const wrapper = setupTest({ placement });
            expect(wrapper.find('[data-qa="drawer"]')).toHaveClassName(className);
        });

        it.each`
            theme                  | className
            ${Drawer.themes.LIGHT} | ${'isThemeLight'}
            ${Drawer.themes.DARK}  | ${'isThemeDark'}
        `('should render closeTheme', ({ theme, className }) => {
            const wrapper = setupTest({ theme });
            expect(wrapper.find('.close')).toHaveClassName(className);
        });

        it('should hide close button if not isCloseable', () => {
            const wrapper = setupTest({ isCloseable: false });
            expect(wrapper.find('button')).toHaveLength(0);
        });

        it('should fire onClose action when close button is clicked', () => {
            const mockOnClose = jest.fn();
            const wrapper = setupTest({ onClose: mockOnClose });
            wrapper.find('button').simulate('click');
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should have a dataId', () => {
            const wrapper = setupTest({ dataId: 'foo' });
            expect(wrapper.find('[data-qa="drawer"]')).toHaveProp('data-id', 'foo');
        });

        it('should accept a close icon title', () => {
            const wrapper = setupTest({ closeIconTitle: 'close page help' });
            expect(wrapper.find('svg title')).toHaveText('close page help');
        });

        it('should be visible when isOpen is true', () => {
            const wrapper = setupTest({ isOpen: true });
            expect(wrapper.find('[data-qa="drawer"]')).toHaveClassName('isOpen');
        });

        it('should show backdrop when hasBackdrop and isOpen', () => {
            const wrapper = setupTest({ isOpen: true, hasBackdrop: true });
            expect(wrapper.find('[data-qa="backdrop"]')).toHaveClassName('isShown');
        });

        it('should not show backdrop when hasBackdrop and not isOpen', () => {
            const wrapper = setupTest({ isOpen: false, hasBackdrop: true });
            expect(wrapper.find('[data-qa="backdrop"]')).not.toHaveClassName('isShown');
        });

        it('should not allow scrolling when backdrop is shown', () => {
            setupTest({ isOpen: true, hasBackdrop: true });
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should allow scrolling when backdrop is not shown', () => {
            setupTest({ isOpen: false, hasBackdrop: true });
            expect(document.body.style.overflow).toBe('auto');
        });

        it('should allow scrolling when drawer is unmounted', () => {
            const wrapper = setupTest({ isOpen: true, hasBackdrop: true });
            expect(document.body.style.overflow).toBe('hidden');
            wrapper.unmount();
            expect(document.body.style.overflow).toBe('auto');
        });
    });
    describe('focus trap', () => {
        let appRoot;
        let onClose;
        let onBackdropClick;
        const children = (
            <React.Fragment>
                <input name="input1" type="text" />
                <input name="input2" type="text" />
            </React.Fragment>
        );

        beforeEach(() => {
            const body = global.document.querySelector('body');
            appRoot = global.document.createElement('div');
            appRoot.setAttribute('id', 'root');
            body.appendChild(appRoot);

            onClose = jest.fn();
            onBackdropClick = jest.fn();
        });

        afterEach(() => {
            onClose.mockReset();
        });

        it('should add aria-hidden to the root when drawer is open', () => {
            mount(<Drawer isOpen> yolo </Drawer>, appRoot);
            expect(appRoot.getAttribute('aria-hidden')).toBe('true');
        });

        it('should not add aria-hidden to the root when drawer is not open', () => {
            mount(<Drawer> yolol </Drawer>, appRoot);
            expect(appRoot.getAttribute('aria-hidden')).toBeFalsy();
        });

        it('should remove aria-hidden from root when drawer is unmounted', () => {
            const wrapper = mount(<Drawer> yolo </Drawer>, appRoot);
            wrapper.unmount();
            expect(appRoot.getAttribute('aria-hidden')).toBeFalsy();
        });

        it('should call `onClose` when `Esc` pressed', () => {
            const wrapper = setupTest({ onClose });
            wrapper.find('[data-qa="drawer"]').simulate('keydown', { key: 'Esc' });
            expect(onClose).toHaveBeenCalled();
        });

        it('should call `onClose` when `Escape` pressed', () => {
            const wrapper = setupTest({ onClose });
            wrapper.find('[data-qa="drawer"]').simulate('keydown', { key: 'Escape' });
            expect(onClose).toHaveBeenCalled();
        });

        it('should call `onBackdropClick` when backdrop is clicked', () => {
            const wrapper = setupTest({ onBackdropClick });
            wrapper.find('Backdrop').simulate('click');
            expect(onBackdropClick).toHaveBeenCalled();
        });

        it('should not crash if `onClose` is not a function', () => {
            const wrapper = setupTest();
            wrapper.find('[data-qa="drawer"]').simulate('keydown', { key: 'Escape' });
        });

        it('should focus close icon', () => {
            const wrapper = setupTest();
            expect(wrapper.find('button').getDOMNode() === document.activeElement).toBe(true);
        });

        it('should cycle forward', () => {
            const wrapper = setupTest({ children });
            const drawer = wrapper.find('[data-qa="drawer"]');
            wrapper.find('[name="input2"]').instance().focus();

            drawer.simulate('keydown', { key: 'Tab' });
            expect(wrapper.find('button').getDOMNode() === document.activeElement).toBe(true);
        });

        it('should cycle backwards', () => {
            const wrapper = setupTest({ children });
            const drawer = wrapper.find('[data-qa="drawer"]');
            drawer.simulate('keydown', { key: 'Tab', shiftKey: true });
            expect(wrapper.find('[name="input2"]').getDOMNode() === document.activeElement).toBe(true);
        });

        it('should handle browser tabbing', () => {
            const wrapper = setupTest({ children });
            const drawer = wrapper.find('[data-qa="drawer"]');
            const preventDefault = jest.fn();
            drawer.simulate('keydown', { key: 'Tab', preventDefault });

            expect(preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('Height resize', () => {
        let wrapper;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        afterEach(() => {
            jest.restoreAllMocks();
            wrapper.unmount();
        });

        it('should set the height to the window innerHeight on mount', () => {
            global.window.innerHeight = 500;

            wrapper = setupTest({ isOpen: true });
            expect(wrapper.find('[data-qa="drawer"]')).toHaveProp('style', {
                height: 500,
            });
        });

        it('should set the height to the window innerHeight on window resize', () => {
            const resizeEvent = document.createEvent('Event');
            resizeEvent.initEvent('resize', true, true);

            global.window.innerHeight = 500;

            wrapper = setupTest({ isOpen: true });

            act(() => {
                global.window.innerHeight = 300;
                global.window.dispatchEvent(resizeEvent);
            });

            wrapper.update();

            expect(wrapper.find('[data-qa="drawer"]')).toHaveProp('style', {
                height: 300,
            });
        });
    });
});
