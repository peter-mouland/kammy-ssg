// /admin/components/sections/settings-section.tsx (REFACTORED)
import React from 'react';
import * as Icons from '../icons/admin-icons';
import { AdminSection, AdminContainer } from '../layout';
import styles from './settings-section.module.css';

export const SettingsSection = () => {
    return (
        <AdminContainer>
            <AdminSection
                title="System Settings"
                icon={<Icons.SettingsIcon />}
            >
                <div className={styles.coming_soon}>
                    <Icons.SettingsIcon />
                    <h3>Settings Panel Coming Soon</h3>
                    <p>Configuration options will be available here in a future update.</p>
                </div>
            </AdminSection>
        </AdminContainer>
    );
};
