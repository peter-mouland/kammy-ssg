import React from 'react';
import bemHelper from '@kammy/bem';
import { useCookies } from 'react-cookie';

import appConfig from '../../config/config';
import NamedLink from '../named-link';
import Spacer from '../spacer';
import './nav-bar.css';

const bem = bemHelper({ block: 'nav' });
const linkClass = bem('link');

const AdminLinks = () => {
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    return isAdmin ? (
        <div className={bem('link', 'right')}>
            <NamedLink to="admin" className={linkClass} />
        </div>
    ) : null;
};

const Index = () => (
    <nav className={bem()}>
        <div className={bem('content')}>
            <Spacer all={{ right: Spacer.spacings.TINY }} tag="span">
                <NamedLink to="homepage" />
            </Spacer>
            <Spacer all={{ horizontal: Spacer.spacings.TINY }} tag="span">
                <NamedLink to="cup" className={linkClass} />
            </Spacer>
            {appConfig.divisionLabels.map((division) => (
                <Spacer key={division} all={{ horizontal: Spacer.spacings.TINY }} tag="span">
                    <div className={linkClass}>
                        <NamedLink to={`${appConfig.divisionSheets[division]}-rankings`}>{division}</NamedLink>
                    </div>
                </Spacer>
            ))}
            <AdminLinks />
        </div>
    </nav>
);

export default Index;
