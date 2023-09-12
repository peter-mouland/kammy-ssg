import * as React from 'react';
import cx from 'classnames';

import * as styles from './spacer.module.css';

type BreakpointName = 'all' | 'small' | 'phablet' | 'medium' | 'large' | 'huge';
type Spacing = 'micro' | 'tiny' | 'small' | 'medium' | 'large' | 'big' | 'huge' | 'super' | 'jumbo';

type Margin = {
    vertical?: Spacing;
    horizontal?: Spacing;
    top?: Spacing;
    right?: Spacing;
    bottom?: Spacing;
    left?: Spacing;
    stack?: Spacing;
    stackH?: Spacing;
};

type BPMargins = Record<BreakpointName, Margin>;

const spacing = {
    MICRO: 'micro',
    TINY: 'tiny',
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    BIG: 'big',
    HUGE: 'huge',
    SUPER: 'super',
    JUMBO: 'jumbo',
} as Record<string, Spacing>;

const snakeToCamel = (str: string) =>
    str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));

const getClassNames = (breakpoints: Partial<BPMargins>) => {
    const breakpointNames = Object.keys(breakpoints) as [keyof BPMargins];
    return breakpointNames.reduce((prevBP, breakpointName) => {
        const breakpoint = breakpoints[breakpointName];
        if (!breakpoint) return prevBP;
        const margins = Object.keys(breakpoint) as [keyof Margin];
        const sizes = margins.reduce((prevSize, marginType) => {
            const marginSize = breakpoint[marginType];
            // do not add @all when it is for all screen sizes
            const classNameModifiers = snakeToCamel(
                [marginType, marginSize, breakpointName !== 'all' ? breakpointName : ''].filter(Boolean).join('-'),
            ) as keyof typeof styles;
            return {
                ...prevSize,
                [styles[classNameModifiers]]: !!styles[classNameModifiers],
            };
        }, {});
        return {
            ...prevBP,
            ...sizes,
        };
    }, {});
};
interface SpacerProps extends Partial<BPMargins> {
    children: React.ReactNode;
    tag?: React.ElementType;
    dataId?: string;
    className?: string;
}
const Spacer: React.FC<SpacerProps> & { spacings: typeof spacing } = ({
    children,
    tag: Tag = 'div',
    all,
    small,
    phablet,
    medium,
    large,
    huge,
    dataId,
    className,
    ...props
}) => {
    const bpsToPass = {} as Partial<BPMargins>;
    if (all) bpsToPass.all = all;
    if (small) bpsToPass.small = small;
    if (phablet) bpsToPass.phablet = phablet;
    if (medium) bpsToPass.medium = medium;
    if (large) bpsToPass.large = large;
    if (huge) bpsToPass.huge = huge;
    const classNames = getClassNames(bpsToPass);
    return (
        <Tag {...props} className={cx(className, classNames)} data-id={dataId}>
            {children}
        </Tag>
    );
};

Spacer.spacings = spacing;

export default Spacer;
