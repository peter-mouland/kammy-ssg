import * as React from 'react'
import PropTypes from 'prop-types';

import * as styles from './popover.module.css';

const Popover = ({ header, body, hasShadow }) => {
    // eslint-disable-next-line react/no-danger
    const Body = typeof body === 'string' ? <div dangerouslySetInnerHTML={{ __html: body }} /> : body;
    return (
        <div className={styles.popover}>
            {header ? <div className={`${styles.header} ${hasShadow ? styles.shadow : ''}`}>{header}</div> : null}
            <div className={styles.body}>{Body}</div>
        </div>
    );
};

Popover.defaultProps = {
    hasShadow: false,
    header: null,
};

Popover.propTypes = {
    /** @type {boolean} if component should have a shadow */
    hasShadow: PropTypes.bool,
    /** @type {string} title text content of the popover */
    header: PropTypes.string,
    /** @type {string} body text content of the popover */
    body: PropTypes.node.isRequired,
};

export default Popover;
