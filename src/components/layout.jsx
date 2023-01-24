// config *must* run before everything else
/* eslint-disable */
import "../config/config";
import { Helmet } from "react-helmet"
/* eslint-enable */

import React from 'react';
import PropTypes from 'prop-types';
import '@kammy/bootstrap';
import { CookiesProvider } from 'react-cookie';

import NavBar from './nav-bar';
import NamedLink from './named-link';
import './index.css';
import * as styles from './layout.module.css';

const Layout = ({ title, description, children, footer }) => (
    <CookiesProvider>
        <Helmet>
            <meta charSet="utf-8" />
            <title>{title}</title>
            {description && <meta name="description" content={description} />}
        </Helmet>
        <div>
            <NavBar />
            <main className={styles.content}>
                <section>{typeof children === 'function' ? children() : children}</section>
            </main>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    {footer}
                    <h2 className={styles.footerHeader}>Relevant Links</h2>
                    <ul className={styles.footerLinks}>
                        {/* <li>*/}
                        {/*    <a href="/game-weeks">Game Weeks</a>*/}
                        {/* </li>*/}
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
        </div>
    </CookiesProvider>
);

Layout.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    footer: PropTypes.oneOfType([PropTypes.node, PropTypes.element, PropTypes.func, PropTypes.arrayOf(PropTypes.node)]),
};

Layout.defaultProps = {
    title: 'Draft FF',
    description: '',
    footer: '',
};

export default Layout;
