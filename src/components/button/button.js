import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import RouterLink from 'gatsby-link';
import toTitleCase from '@kammy/helpers.title-case';

import Loader from '../loader';
import { types, sizes, themes } from './constants';
import styles from './button.module.css';

// eslint-disable-next-line react/prop-types
const ButtonText = ({ isLoading, size, children }) => {
    const sizeClass = styles[`isSize${toTitleCase(size)}`];
    const loaderClass = cx(styles.loaderWrapper, sizeClass);
    // const TextButton = size === sizes.LARGE ? Text.Button1 : Text.Button2;
    return (
        <div>
            {isLoading ? (
                <div className={loaderClass}>
                    <div className={styles.loader}>
                        <Loader size={Loader.sizes[size]} />
                    </div>
                    {'\u00A0'}
                </div>
            ) : (
                children
            )}
        </div>
    );
};

const getTarget = ({ href, newTab }) => {
    if (!href) return null;
    return newTab ? '_blank' : '_self';
};

const Button = ({
    children,
    type,
    size,
    theme,
    isWide,
    isNarrow,
    isFlat,
    isResponsive,
    isDisabled,
    isLoading,
    href,
    dataId,
    htmlType,
    newTab,
    onClick,
    ...routerProps
}) => {
    const getIsDisabled = () => isDisabled || isLoading;

    const handleClick = (e) => {
        if (!getIsDisabled() && onClick) {
            onClick(e);
        }
    };
    const typeClass = styles[`isType${toTitleCase(type)}`];
    const sizeClass = styles[`isSize${toTitleCase(size)}`];
    const themeClass = styles[`isTheme${toTitleCase(theme)}`];
    const isInternalLink = !newTab && href && !href.startsWith('http');
    const Tag = href ? 'a' : 'button';
    const buttonProps = {
        className: cx(styles.component, typeClass, sizeClass, themeClass, {
            [styles.isWide]: isWide,
            [styles.isNarrow]: isNarrow,
            [styles.isFlat]: isFlat,
            [styles.isDisabled]: isDisabled,
            [styles.isResponsive]: isResponsive,
        }),
        disabled: getIsDisabled(),
        onClick: handleClick,
    };

    return isInternalLink ? (
        <RouterLink {...buttonProps} {...routerProps} data-id={dataId} data-qa="button" to={href}>
            <ButtonText {...{ isLoading, size, children }} />
        </RouterLink>
    ) : (
        <Tag
            {...routerProps}
            {...buttonProps}
            href={href || undefined}
            type={href ? '' : htmlType}
            target={getTarget({ href, newTab })}
            rel={getTarget({ href, newTab }) && 'noopener noreferrer'}
            data-qa="button"
            data-id={dataId}
        >
            <ButtonText {...{ isLoading, size, children }} />
        </Tag>
    );
};

Button.types = types;
Button.sizes = sizes;
Button.themes = themes;

Button.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(Object.values(types)),
    size: PropTypes.oneOf(Object.values(sizes)),
    theme: PropTypes.oneOf(Object.values(themes)),
    isWide: PropTypes.bool,
    isNarrow: PropTypes.bool,
    isFlat: PropTypes.bool,
    isResponsive: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    href: PropTypes.string,
    newTab: PropTypes.bool,
    htmlType: PropTypes.string,
    dataId: PropTypes.string,
};

Button.defaultProps = {
    type: types.PRIMARY,
    size: sizes.SMALL,
    theme: themes.LIGHT,
    isWide: false,
    isNarrow: false,
    isFlat: false,
    isResponsive: false,
    isDisabled: false,
    isLoading: false,
    onClick: null,
    href: null,
    newTab: false,
    htmlType: 'button',
    dataId: undefined,
};

export default Button;
