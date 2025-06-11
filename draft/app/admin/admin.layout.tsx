// /admin/admin-dashboard-layout.tsx
import React from 'react';
import { useRevalidator, useLocation, useNavigate } from 'react-router';
import * as Icons from './components/icons/admin-icons';
import { SystemHealthBadge } from './components/ui/system-health-badge'
import { NavButton } from './components/ui/nav-button'
import { NavGroup } from './components/ui/nav-group'
import { RefreshButton } from './components/ui/refresh-button'

import { AdminSection } from './components/layout/admin-section'
import { AppShell } from './components/layout/app-shell'
import { ActionBar } from './components/layout/action-bar'
import { TwoColumnLayout } from './components/layout/two-column-layout'

import type { AdminNavItem } from './types';

interface AdminDashboardLayoutProps {
    children: React.ReactNode;
}

const navigationItems: AdminNavItem[] = [
    {
        key: 'overview',
        label: 'Overview',
        icon: <Icons.DatabaseIcon />,
        path: '/admin'
    },
    {
        key: 'draft',
        label: 'Draft Management',
        icon: <Icons.UsersIcon />,
        path: '/admin/draft'
    },
    {
        key: 'points',
        label: 'Points & Scoring',
        icon: <Icons.ChartIcon />,
        path: '/admin/points'
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: <Icons.SettingsIcon />,
        path: '/admin/settings'
    }
];

export const AdminLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
    const revalidator = useRevalidator();
    const location = useLocation();
    const navigate = useNavigate();

    const handleRefreshAll = () => {
        // Revalidate the route data (refetch from loader)
        revalidator.revalidate();
    };

    const getActiveSection = () => {
        const path = location.pathname;
        if (path === '/admin') return 'overview';
        if (path.startsWith('/admin/draft')) return 'draft';
        if (path.startsWith('/admin/points')) return 'points';
        if (path.startsWith('/admin/settings')) return 'settings';
        return 'overview';
    };

    const activeSection = getActiveSection();

    return (
        <AppShell background="gray">
            <TwoColumnLayout.Container gap="lg" maxWidth="1200px">
                <TwoColumnLayout.Header>
                    <AdminSection
                        title="Admin Dashboard"
                        description="Manage your fantasy football draft system"
                        actions={
                            <ActionBar align="right">
                                <SystemHealthBadge />
                                <RefreshButton
                                    onClick={handleRefreshAll}
                                    loading={revalidator.state === 'loading'}
                                />
                            </ActionBar>
                        }
                    />
                </TwoColumnLayout.Header>

                <TwoColumnLayout.ContentContainer>
                    <TwoColumnLayout.Sidebar width="16rem">
                        <NavGroup direction="vertical">
                            {navigationItems.map((item) => (
                                <NavButton
                                    key={item.key}
                                    active={activeSection === item.key}
                                    onClick={() => navigate(item.path)}
                                    icon={item.icon}
                                    label={item.label}
                                />
                            ))}
                        </NavGroup>
                    </TwoColumnLayout.Sidebar>

                    <TwoColumnLayout.Content>
                        {children}
                    </TwoColumnLayout.Content>
                </TwoColumnLayout.ContentContainer>
            </TwoColumnLayout.Container>
        </AppShell>
    );
};

export default AdminLayout;
