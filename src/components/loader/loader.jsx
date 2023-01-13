import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import toTitleCase from '@kammy/helpers.title-case';
import { timing } from '@kammy/tokens';

import { sizes } from './constants';
import * as styles from './loader.module.css';

const Loader = ({ size, animationDuration }) => {
    const inlineStyles = { animationDuration };

    return (
        <div
            data-testid="loader"
            className={cx(styles.component, styles[`isSize${toTitleCase(size)}`])}
            style={inlineStyles}
        />
    );
};

Loader.propTypes = {
    size: PropTypes.oneOf(Object.values(sizes)),
    animationDuration: PropTypes.string,
};

Loader.defaultProps = {
    size: sizes.MEDIUM,
    animationDuration: timing['rnb-timing-normal'],
};

Loader.sizes = sizes;

export default Loader;
