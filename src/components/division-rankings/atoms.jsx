import React, { Fragment } from 'react';
import bemHelper from '@kammy/bem';

import Spacer from '../spacer';
import * as styles from './index.module.css';

const bem = bemHelper({ block: 'division-stats' });

export const Th = ({ category, colSpan, children }) => (
    <th key={children} colSpan={colSpan} className={`cell cell--${category}`}>
        {children}
    </th>
);

export const Td = ({ children, small }) => <td className={`cell ${small ? 'cell--pair' : ''}`}>{children}</td>;
export const TdPair = ({ rank, point }) => {
    const gradient = `gradient_${parseInt(rank, 10).toString().replace('.', '_').replace('-', '_')}`;
    return (
        <Fragment>
            <td className={`cell cell--rank ${styles[gradient]}`}>{rank}</td>
            <td className={`cell cell--pair cell--point ${styles[gradient]}`}>{point}</td>
        </Fragment>
    );
};

export const Thead = ({ children }) => (
    <thead>
        <tr className="row row--header">{children}</tr>
    </thead>
);

export const Tr = ({ children }) => <tr className="row">{children}</tr>;

export const Tbody = ({ children }) => <tbody>{children}</tbody>;
export const Table = ({ children, isLoading }) => (
    <table className={`table ${isLoading && 'table--placeholder'}`}>{children}</table>
);
export const Title = ({ children }) => (
    <h2>
        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>{children}</Spacer>
    </h2>
);
export const Body = ({ children }) => <div data-b-layout="row vpad">{children}</div>;

export const Container = ({ children }) => (
    <section id="division-ranking-page" className={bem(null, null, 'page-content')}>
        <div data-b-layout="row vpad">{children}</div>
    </section>
);
