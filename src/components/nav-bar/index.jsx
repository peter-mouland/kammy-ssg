import React from 'react';
import { useCookies } from 'react-cookie';

import NamedLink from '../named-link';
import HomeIcon from '../icons/home.svg';
import Spacer from '../spacer';
import * as styles from './nav-bar.module.css';

const linkClass = styles.nav__link;

const Index = () => {
    const [cookies] = useCookies(['is-admin']);
    const isAdmin = cookies['is-admin'] === 'true' || false;
    return (
        <nav className={styles.nav}>
            <div className={styles.nav__content}>
                <Spacer all={{ right: Spacer.spacings.TINY }} tag="span">
                    <NamedLink to="homepage" className={styles.home}>
                        <HomeIcon width="26px" height="26px" />
                        Drafft
                    </NamedLink>
                </Spacer>
                <Spacer all={{ horizontal: Spacer.spacings.TINY }} tag="span">
                    <NamedLink to="cup" className={linkClass} />
                </Spacer>
                <Spacer all={{ horizontal: Spacer.spacings.TINY }} tag="span">
                    {isAdmin ? <NamedLink to="admin" className={linkClass} /> : null}
                </Spacer>
            </div>
        </nav>
    );
};

export default Index;
