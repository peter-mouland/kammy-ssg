import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import NavBar from '../nav-bar';

import './default-template.scss';

const Index = ({ children }) => {
  const bem = bemHelper({ block: 'layout' });
  return (
    <div className={bem(null, 'main')}>
      <NavBar className={bem('nav')} />
      <main className={bem('content')}>
        { children}
      </main>
      <footer className={bem('footer')}>
        <div className={bem('footer-content')}>
          Hosted at <a href="http://github.com/peter-mouland/kammy-ui">github.com/peter-mouland/kammy-ui</a>
        </div>
      </footer>
    </div>
  );
};

Index.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Index;
