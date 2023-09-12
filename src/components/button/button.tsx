import * as React from 'react';
import cx from 'classnames';
import { Link as RouterLink } from 'gatsby';
import toTitleCase from '@kammy/helpers.title-case';

import Loader from '../loader';
import * as styles from './button.module.css';

import type { GatsbyLinkProps } from 'gatsby';

type Size = 'TINY' | 'SMALL' | 'LARGE';
type Types = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'STICKY';
type Theme = 'LIGHT' | 'DARK';

export const types = {
    PRIMARY: 'PRIMARY',
    SECONDARY: 'SECONDARY',
    TERTIARY: 'TERTIARY',
    STICKY: 'STICKY',
} as Record<Types, Types>;

export const sizes = {
    TINY: 'TINY',
    SMALL: 'SMALL',
    LARGE: 'LARGE',
} as Record<Size, Size>;

export const themes = {
    LIGHT: 'LIGHT',
    DARK: 'DARK',
} as Record<Theme, Theme>;

type ButtonTextProps = {
    isLoading: boolean;
    size: Size;
    children: React.ReactNode;
};
// eslint-disable-next-line react/prop-types
const ButtonText: React.FC<ButtonTextProps> = ({ isLoading, size, children }) => {
    const sizeClass = styles[`isSize${toTitleCase(size)}` as keyof typeof styles];
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

const getTarget = ({ href, newTab }: { href: string; newTab: boolean }) => {
    if (!href) return null;
    return newTab ? '_blank' : '_self';
};

type CustomButtonProps = {
    type?: Types;
    size?: Size;
    theme?: Theme;
    isWide?: boolean;
    isNarrow?: boolean;
    isFlat?: boolean;
    isResponsive?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    dataId?: string;
    htmlType?: string;
    newTab?: boolean;
    href?: string;
};
const Button: React.FC<Partial<GatsbyLinkProps<Record<string, unknown>>> & CustomButtonProps> & {
    types: typeof types;
    sizes: typeof sizes;
    themes: typeof themes;
} = ({
    children,
    type = 'PRIMARY',
    size = 'SMALL',
    theme = 'LIGHT',
    isWide = false,
    isNarrow = false,
    isFlat = false,
    isResponsive = false,
    isDisabled = false,
    isLoading = false,
    href = '',
    dataId = '',
    htmlType = 'button',
    newTab = false,
    ...routerProps
}) => {
    const getIsDisabled = () => isDisabled || isLoading;

    const typeClass = styles[`isType${toTitleCase(type)}` as keyof typeof styles];
    const sizeClass = styles[`isSize${toTitleCase(size)}` as keyof typeof styles];
    const themeClass = styles[`isTheme${toTitleCase(theme)}` as keyof typeof styles];
    const isInternalLink = !newTab && href && !href.startsWith('http');
    const Tag = (href ? 'a' : 'button') as React.ElementType;
    const buttonProps = {
        className: cx(styles.component, typeClass, sizeClass, themeClass, {
            [styles.isWide]: isWide,
            [styles.isNarrow]: isNarrow,
            [styles.isFlat]: isFlat,
            [styles.isDisabled]: isDisabled,
            [styles.isResponsive]: isResponsive,
        }),
        disabled: getIsDisabled(),
        onClick: (isDisabled || isLoading) && routerProps.onClick,
    };

    return isInternalLink ? (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <RouterLink {...buttonProps} {...routerProps} data-id={dataId} data-qa="button" to={href}>
            <ButtonText isLoading={isLoading} size={size}>
                {children}
            </ButtonText>
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
            <ButtonText isLoading={isLoading} size={size}>
                {children}
            </ButtonText>
        </Tag>
    );
};

Button.types = types;
Button.sizes = sizes;
Button.themes = themes;

export default Button;
