import React from 'react';
import PropTypes from 'prop-types';
import cs from 'classnames';

import * as styles from './grid-container.css';

const GridContainer = ({ children, isFullWidth }) => (
    <div className={cs(styles.component, { [styles.fullWidth]: isFullWidth })}>{children}</div>
);

GridContainer.propTypes = {
    children: PropTypes.node.isRequired,
    isFullWidth: PropTypes.bool,
};
GridContainer.defaultProps = {
    isFullWidth: false,
};

export default GridContainer;
