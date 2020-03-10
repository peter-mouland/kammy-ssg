import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import { withCookies, Cookies } from 'react-cookie';


import NamedLink from '../named-link';
import NavItem from './components/nav-item';

import './nav-bar.scss';

const bem = bemHelper({ block: 'nav' });
const linkClass = bem('link');

const AdminLinks = ({ cookies }) => (
  cookies.get('is-admin')
    ? (
      <div className={bem('link', 'right')}>
        <NavItem label='Admin' to='admin'>
          <NamedLink to="admin-players" className={linkClass}/>
          <NamedLink to="admin-cup" className={linkClass}/>
          <a href="/google-spreadsheet/cache/reset" className={linkClass}>Reset Spreadsheet Cache</a>
        </NavItem>
      </div>
    )
    : null
);

AdminLinks.propTypes = {
  cookies: PropTypes.instanceOf(Cookies).isRequired,
};

const Index = ({ cookies }, { appConfig }) => (
  <nav className={bem()}>
    <div className={bem('content')}>
      <NavItem label='DraftFF' className={linkClass}>
        <NamedLink to="homepage" />
        <NamedLink to="rules" />
        <NamedLink to="prize-money" />
      </NavItem>
      <NavItem label='Cup' className={linkClass}>
        <NamedLink to="cup" className={linkClass} />
        <NamedLink to="cup-scores" className={linkClass} />
      </NavItem>
      {
        appConfig.divisionLabels.map((division) => (
          <div key={division} className={linkClass}>
            <NavItem label={division} openOnClick>
              <NamedLink to={`${appConfig.divisionSheets[division]}-rankings`} className={linkClass} />
              <NamedLink to={`${appConfig.divisionSheets[division]}-teams`} className={linkClass} />
              <NamedLink to={`${appConfig.divisionSheets[division]}-players`} className={linkClass} />
              <NamedLink to={`${appConfig.divisionSheets[division]}-transfers`} className={linkClass} />
              <NamedLink to={`${appConfig.divisionSheets[division]}-draft`} className={linkClass} />
            </NavItem>
          </div>
        ))
      }
      <AdminLinks cookies={cookies} />
    </div>
  </nav>
);

Index.propTypes = {
  cookies: PropTypes.instanceOf(Cookies).isRequired,
};

Index.contextTypes = {
  appConfig: PropTypes.object,
};

export default withCookies(Index);
