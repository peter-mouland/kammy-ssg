// config *must* run before everything else
/* eslint-disable */
import "../config/config";
/* eslint-enable */

import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import '@kammy/bootstrap';
import { CookiesProvider } from 'react-cookie';

import NavBar from './nav-bar';
import NamedLink from './named-link';
import './index.css';

const Layout = ({ children }) => {
    const bem = bemHelper({ block: 'layout' });
    return (
        <CookiesProvider>
            <div className={bem(null, 'main')}>
                <NavBar className={bem('nav')} />
                <main className={bem('content')}>
                    <section className={bem()}>{typeof children === 'function' ? children() : children}</section>
                </main>
                <footer className={bem('footer')}>
                    <div className={bem('footer-content')}>
                        <h2 className={bem('footer-header')}>Relevant Links</h2>
                        <ul className={bem('footer-links')}>
                            <li>
                                <NamedLink to="rules" />
                            </li>
                            <li>
                                <NamedLink to="prize-money" />
                            </li>
                            <li>
                                <a href="/players-1920">Players Pages (Season 19-20)</a>
                            </li>
                            <li>
                                <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Report Bugs</a>
                            </li>
                        </ul>
                    </div>
                </footer>
            </div>
        </CookiesProvider>
    );
};

Layout.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
};

export default Layout;
