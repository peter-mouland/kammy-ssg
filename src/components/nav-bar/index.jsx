import React from 'react';
import { useCookies } from 'react-cookie';

import appConfig from '../../config/config';
import NamedLink from '../named-link';
import Spacer from '../spacer';
import * as styles from './nav-bar.module.css';

const linkClass = styles.nav__link;

const AdminLinks = () => {
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    return isAdmin ? (
        <div>
            <NamedLink to="admin" className={linkClass} />
        </div>
    ) : null;
};

const Index = () => (
    <nav className={styles.nav}>
        <div className={styles.nav__content}>
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
