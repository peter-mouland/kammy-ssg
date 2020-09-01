import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import styles from './spacer.module.css';

const breakpointNames = ['all', 'small', 'phablet', 'medium', 'large', 'huge'];

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
};

const marginTypes = {
    vertical: PropTypes.string,
    horizontal: PropTypes.string,
    top: PropTypes.string,
    right: PropTypes.string,
    bottom: PropTypes.string,
    left: PropTypes.string,
    stack: PropTypes.string,
    stackH: PropTypes.string,
};
const snakeToCamel = (str) => str.replace(
    /([-_][a-z])/g,
    (group) => group.toUpperCase()
        .replace('-', '')
        .replace('_', ''),
);
// todo: use selector to cache results?
const getClassNames = (breakpoints) => breakpoints.reduce(
    (prevBP, bpConfig, bpIndex) => ({
        ...prevBP,
        ...Object.keys(bpConfig).reduce((prevSize, marginType) => {
            const breakpoint = breakpointNames[bpIndex];
            const marginSize = bpConfig[marginType];
            const classNameModifiers = snakeToCamel([marginType, marginSize, bpIndex > 0 ? breakpoint : ''].filter(Boolean).join('-'));
            // do not add @all when it is for all screen sizes
            const className = bpIndex > 0 ? `${classNameModifiers}${breakpoint}` : classNameModifiers;
            console.log({className, classNameModifiers, s: styles[className]})
            return {
                ...prevSize,
                [styles[classNameModifiers]]: !!styles[classNameModifiers],
            };
        }, {}),
    }),
    {},
);

console.log(styles)

const Spacer = ({
    children, tag: Tag, all, small, phablet, medium, large, huge, dataId, className, ...props
}) => {
    const breakpointsWithAllShorthand = [all, small, phablet, medium, large, huge];
    const classNames = getClassNames(breakpointsWithAllShorthand);
    return (
        <Tag {...props} className={cx(className, classNames)} data-id={dataId}>
            {children}
        </Tag>
    );
};

Spacer.spacings = spacing;
Spacer.propTypes = {
    children: PropTypes.node,
    tag: PropTypes.string,
    dataId: PropTypes.string,
    className: PropTypes.string,
    all: PropTypes.shape(marginTypes),
    small: PropTypes.shape(marginTypes),
    phablet: PropTypes.shape(marginTypes),
    medium: PropTypes.shape(marginTypes),
    large: PropTypes.shape(marginTypes),
    huge: PropTypes.shape(marginTypes),
};

Spacer.defaultProps = {
    tag: 'div',
    children: null,
    dataId: null,
    all: {},
    small: {},
    phablet: {},
    medium: {},
    large: {},
    huge: {},
};

export default Spacer;
