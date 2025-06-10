
// /admin/components/sections/settings-section.tsx
import React from 'react';
import * as Icons from '../components/admin-icons';
import styles from './settings-section.module.css';

export const SettingsSection = () => {
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.SettingsIcon />
                        System Settings
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.comingSoon}>
                        <Icons.SettingsIcon />
                        <h3>Settings Panel Coming Soon</h3>
                        <p>Configuration options will be available here in a future update.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
