import * as React from 'react'
import cx from 'classnames';
import toTitleCase from '@kammy/helpers.title-case';
import { timing } from '@kammy/tokens';

import * as styles from './loader.module.css';

export const sizes = {
    TINY: 'TINY',
    SMALL: 'SMALL',
    MEDIUM: 'MEDIUM',
    LARGE: 'LARGE',
    FULL_WIDTH: 'FULL_WIDTH',
} as const;

type LoaderProps = {
    size: ValueOf<typeof sizes>;
    animationDuration: ValueOf<typeof timing>;
};

const Loader: React.FC<LoaderProps> & { sizes: typeof sizes } = ({
    size = 'MEDIUM',
    animationDuration = timing['rnb-timing-normal'],
}) => {
    const inlineStyles = { animationDuration };

    return (
        <div
            data-testid="loader"
            className={cx(styles.component, styles[`isSize${toTitleCase(size)}` as keyof typeof styles])}
            style={inlineStyles}
        />
    );
};

Loader.sizes = sizes;

export default Loader;
