// config *must* run before everything else
/* eslint-disable */
import "../config/config";
import { Helmet } from "react-helmet"
/* eslint-enable */

import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import '@kammy/bootstrap';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from 'react-query';

import NavBar from './nav-bar';
import NamedLink from './named-link';
import './index.css';
import useMeta from '../hooks/use-meta';
import Spacer from './spacer';

const queryClient = new QueryClient();

const Layout = ({ title, description, children }) => {
    const bem = bemHelper({ block: 'layout' });
    const { formattedTime, getFromNow } = useMeta();
    return (
        <QueryClientProvider client={queryClient}>
            <CookiesProvider>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>{title}</title>
                    {description && <meta name="description" content={description} />}
                </Helmet>
                <div className={bem(null, 'main')}>
                    <NavBar className={bem('nav')} />
                    <main className={bem('content')}>
                        <section className={bem()}>{typeof children === 'function' ? children() : children}</section>
                    </main>
                    <footer className={bem('footer')}>
                        <div className={bem('footer-content')}>
                            <Spacer
                                all={{ vertical: Spacer.spacings.MEDIUM, horizontal: Spacer.spacings.LARGE }}
                                style={{ fontSize: '0.9em' }}
                            >
                                <strong style={{ color: '#888', fontSize: '0.9em' }}>Last Build:</strong>{' '}
                                {formattedTime}{' '}
                                <small style={{ color: '#888', fontSize: '0.9em' }}>({getFromNow()})</small>
                            </Spacer>
                            <h2 className={bem('footer-header')}>Relevant Links</h2>
                            <ul className={bem('footer-links', 'misc')}>
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
                            <h2 className={bem('footer-header', 'draft')}>Drafts</h2>
                            <ul className={bem('footer-links', 'draft')}>
                                <li>
                                    <NamedLink to="premierLeague-draft">Premier League</NamedLink>
                                </li>
                                <li>
                                    <NamedLink to="championship-draft">Championship</NamedLink>
                                </li>
                                <li>
                                    <NamedLink to="leagueOne-draft">League One</NamedLink>
                                </li>
                                <li>
                                    <NamedLink to="leagueTwo-draft">League Two</NamedLink>
                                </li>
                            </ul>
                        </div>
                    </footer>
                </div>
            </CookiesProvider>
        </QueryClientProvider>
    );
};

Layout.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
};

Layout.defaultProps = {
    title: 'Draft FF',
    description: '',
};

export default Layout;
