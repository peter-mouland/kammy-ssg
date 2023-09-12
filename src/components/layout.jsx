// config *must* run before everything else
/* eslint-disable */
import "../config/config";
/* eslint-enable */

import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import '@kammy/bootstrap';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryParamProvider } from 'use-query-params';
import { ReachAdapter } from 'use-query-params/adapters/reach';

import NamedLink from './named-link';
import './index.css';
import * as styles from './layout.module.css';
import Spacer from './spacer';

const queryClient = new QueryClient();

export const Footer = ({ children }) => (
    <footer className={cx(styles.footer, styles.gridFooter)}>
        <div className={styles.footerContent}>
            {children}
            <h2 className={styles.footerHeader}>Relevant Links</h2>
            <ul className={styles.footerLinks}>
                <li>
                    <NamedLink to="rules" />
                </li>
                <li>
                    <NamedLink to="prize-money" />
                </li>
                <li>
                    <a href="/players-1920">Players (2019-2020)</a>
                </li>
                <li>
                    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Report Bugs</a>
                </li>
            </ul>
            <h2 className={`${styles.footerHeader} ${styles.footerHeaderDraft}`}>Drafts</h2>
            <ul className={`${styles.footerLinks} ${styles.footerLinksDraft}`}>
                <li>
                    <NamedLink to="premierLeague-draft">Premier League</NamedLink>
                </li>
                <li>
                    <NamedLink to="championship-draft">Championship</NamedLink>
                </li>
                <li>
                    <NamedLink to="leagueOne-draft">League One</NamedLink>
                </li>
                <li />
            </ul>
        </div>
    </footer>
);

export const Body = ({ children }) => (
    <main className={cx(styles.content, styles.gridBody)} data-b-layout="container">
        <section>{typeof children === 'function' ? children() : children}</section>
    </main>
);
export const PrimaryNav = ({ children }) => <nav className={cx(styles.gridPrimaryNav)}>{children}</nav>;
export const SecondaryNav = ({ children }) => <nav className={cx(styles.gridSecondaryNav)}>{children}</nav>;
export const TertiaryNav = ({ children }) => <nav className={cx(styles.gridTertiaryNav)}>{children}</nav>;
export const Title = ({ children }) => (
    <h1>
        <Spacer all={{ vertical: Spacer.spacings.SMALL }}>{children}</Spacer>
    </h1>
);

export const Container = ({ children }) => (
    <QueryParamProvider adapter={ReachAdapter}>
        <QueryClientProvider client={queryClient}>
            <CookiesProvider>
                <div className={styles.layoutGrid}>{children}</div>
            </CookiesProvider>
        </QueryClientProvider>
    </QueryParamProvider>
);

Container.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
};

export default Container;
