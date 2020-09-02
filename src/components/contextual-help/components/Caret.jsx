/* eslint-disable id-length */
import React from 'react';
import PropTypes from 'prop-types';
import BemHelper from '@kammy/bem';

import './caret.scss';

const bem = BemHelper({ block: 'caret' });

export default function Caret({ x, isUp }) {
    const caretClass = bem(null, {
        up: isUp,
        down: !isUp,
    });
    return <div style={{ transform: `translate(${x || 0}px)` }} className={caretClass} />;
}

Caret.propTypes = {
    isUp: PropTypes.bool.isRequired,
    x: PropTypes.number.isRequired,
};
