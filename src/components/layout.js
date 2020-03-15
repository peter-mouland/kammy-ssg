// config *must* run before everything else
/* eslint-disable */
import "../config/config";
/* eslint-enable */

import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import '@kammy/bootstrap/dist/bootstrap.min.css';

import NavBar from '../components/nav-bar';

import './index.css';

const Layout = ({ children }) => {
  const bem = bemHelper({ block: 'layout' });
  return (
    <div className={bem(null, 'main')}>
      <NavBar className={bem('nav')} />
      <main className={bem('content')}>
        <section className={bem()}>
          {typeof children === 'function' ? children() : children}
        </section>
      </main>
      <footer className={bem('footer')}>
        <div className={bem('footer-content')}>
          Hosted at <a href="http://github.com/peter-mouland/kammy-ui">github.com/peter-mouland/kammy-ui</a>
        </div>
      </footer>
    </div>
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
