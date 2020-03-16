import React from 'react';
import PropTypes from 'prop-types';

import BemHelper from '@kammy/bem';

import './popover.scss';

const bem = BemHelper({ block: 'popover' });

const Popover = ({
    header, body, hasShadow,
}) => (
    <div className={bem(null, { shadow: hasShadow })}>
        {header ? <div className={bem('header')}>{header}</div> : null}
        <div className={bem('body')}>{body}</div>
    </div>
);

Popover.defaultProps = {
    hasShadow: false,
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
