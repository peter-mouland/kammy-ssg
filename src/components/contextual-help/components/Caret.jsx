/* eslint-disable id-length */
import * as React from 'react'
import PropTypes from 'prop-types';

import * as styles from './caret.module.css';

export default function Caret({ x, isUp }) {
    const caretClass = `${styles.caret} ${isUp ? styles.up : styles.down}`;
    return <div style={{ transform: `translate(${x || 0}px)` }} className={caretClass} />;
}

Caret.propTypes = {
    isUp: PropTypes.bool.isRequired,
    x: PropTypes.number.isRequired,
};
