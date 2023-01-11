import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Icon from '../icons/cross.svg';
import Portal from '../portal';
import * as styles from './drawer.module.css';
import { placements, themes } from './constants';
import useFocusTrap from './useFocusTrap';
import useUpdateHeight from './useUpdateHeight';

const Backdrop = ({ isShown, onClick }) => (
    <div onClick={onClick} data-qa="backdrop" className={cx(styles.backdrop, { [styles.isShown]: isShown })} />
);

const Drawer = ({
    children,
    placement,
    isCloseable,
    onClose,
    isOpen,
    hasBackdrop,
    dataId,
    onBackdropClick,
    theme,
    closeIconTitle,
}) => {
    const drawerClass = cx(styles.component, styles[`isTheme${theme}`], {
        [styles.isRight]: placement === placements.RIGHT,
        [styles.isBottom]: placement === placements.BOTTOM,
        [styles.isLeft]: placement === placements.LEFT,
        [styles.isOpen]: isOpen,
    });
    const closeIconClass = cx(styles.close, styles[`isTheme${theme}`]);
    const isBackdropShown = hasBackdrop && isOpen;
    const containerRef = useRef();

    const handleEscape = useCallback(
        (event) => {
            // NOTE: not 100% sure if react normalizes IE event so check for it
            if ((event.key === 'Esc' || event.key === 'Escape') && typeof onClose === 'function') {
                event.preventDefault();
                onClose();
            }
        },
        [onClose],
    );

    const keyHandler = useFocusTrap({
        hasBackdrop,
        isBackdropShown,
        isOpen,
        containerRef,
        onKeyDown: handleEscape,
    });
    const { height } = useUpdateHeight();

    return (
        <Portal>
            <Backdrop onClick={onBackdropClick} isShown={isBackdropShown} />
            <div
                ref={containerRef}
                className={drawerClass}
                data-qa="drawer"
                data-id={dataId}
                aria-label="drawer"
                onKeyDown={keyHandler}
                style={{ height }}
            >
                {isCloseable && (
                    <button className={closeIconClass} type="button" onClick={onClose} data-qa="drawer-close-button">
                        <Icon height={32} width={32} title={closeIconTitle} />
                    </button>
                )}
                <div className={styles.drawerContent}>{children}</div>
            </div>
        </Portal>
    );
};

Backdrop.propTypes = {
    isShown: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
};

Backdrop.defaultProps = {
    onClick: null,
};

Drawer.propTypes = {
    children: PropTypes.node,
    placement: PropTypes.oneOf(Object.keys(placements)),
    isCloseable: PropTypes.bool,
    onClose: PropTypes.func,
    onBackdropClick: PropTypes.func,
    isOpen: PropTypes.bool,
    hasBackdrop: PropTypes.bool,
    dataId: PropTypes.string,
    theme: PropTypes.oneOf(Object.keys(themes)),
    closeIconTitle: PropTypes.string,
};

Drawer.defaultProps = {
    placement: placements.RIGHT,
    isCloseable: true,
    onClose: null,
    onBackdropClick: null,
    isOpen: false,
    hasBackdrop: false,
    children: null,
    dataId: '',
    theme: 'LIGHT',
    closeIconTitle: 'close drawer',
};

Drawer.themes = themes;
Drawer.placements = placements;

export default Drawer;
