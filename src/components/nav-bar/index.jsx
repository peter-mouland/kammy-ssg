import React from 'react';
// import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
// import { withCookies, Cookies } from 'react-cookie';

import appConfig from '../../config/config';
import NamedLink from '../named-link';
import NavItem from './components/nav-item';

import './nav-bar.scss';
import Spacer from '../spacer';

const bem = bemHelper({ block: 'nav' });
const linkClass = bem('link');

// const AdminLinks = ({ cookies }) => (
//     cookies.get('is-admin')
//         ? (
//             <div className={bem('link', 'right')}>
//                 <NavItem label='Admin' to='admin'>
//                     <NamedLink to="admin-players" className={linkClass}/>
//                     <NamedLink to="admin-cup" className={linkClass}/>
//                     <a href="/google-spreadsheet/cache/reset" className={linkClass}>Reset Spreadsheet Cache</a>
//                 </NavItem>
//             </div>
//         )
//         : null
// );

const Index = () => (
    <nav className={bem()}>
        <div className={bem('content')}>
            <Spacer all={{ right: Spacer.spacings.TINY }} tag={'span'}>
                <NamedLink to="homepage" />
            </Spacer>
            <Spacer all={{ horizontal: Spacer.spacings.TINY }} tag={'span'}>
                <NamedLink to="cup" className={linkClass} />
            </Spacer>
            {
                appConfig.divisionLabels.map((division) => (
                    <Spacer key={division} all={{ horizontal: Spacer.spacings.TINY }} tag={'span'}>
                        <div className={linkClass}>
                            <NamedLink to={`${appConfig.divisionSheets[division]}-rankings`}>{division}</NamedLink>
                        </div>
                    </Spacer>
                ))
            }
            {/* <AdminLinks cookies={cookies} /> */}
        </div>
    </nav>
);

export default Index;
