/* eslint-disable max-len */
import React from 'react';
import cx from 'classnames';

import Spacer from '../spacer';
import * as styles from './division-stats.module.css';

export const Title = ({ children }) => (
    <h2>
        <Spacer all={{ top: Spacer.spacings.LARGE, bottom: Spacer.spacings.SMALL }}>{children}</Spacer>
    </h2>
);

export const Th = ({ children, desktopOnly = false, separator = false }) => (
    <th className={cx(styles.cell, { [styles.show625]: desktopOnly, [styles.separator]: separator })}>{children}</th>
);
export const Td = ({ children, desktopOnly = false, separator = false }) => (
    <td className={cx(styles.cell, { [styles.show625]: desktopOnly, [styles.separator]: separator })}>{children}</td>
);
export const Thead = ({ children }) => (
    <thead>
        <tr className="row row--header">{children}</tr>
    </thead>
);

export const Tr = ({ hasWarning, hasChanged, children }) => (
    <tr className={cx(styles.row, { [styles.transfer]: hasChanged, [styles.warning]: hasWarning })}>{children}</tr>
);

export const Tbody = ({ children }) => <tbody>{children}</tbody>;
export const Table = ({ children }) => <table className={styles.table}>{children}</table>;

export default Table;
