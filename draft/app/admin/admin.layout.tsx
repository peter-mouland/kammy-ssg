/* Location: app/admin/admin.layout.tsx */

// /admin/admin-dashboard-layout.tsx
import type React from 'react';
import { useLocation } from 'react-router';
import * as Icons from './components/icons/admin-icons';
import { ActionBar } from './components/layout/action-bar';
import { AdminSection } from './components/layout/admin-section';
import { AppShell } from './components/layout/app-shell';
import { TwoColumnLayout } from './components/layout/two-column-layout';
import { NavButton } from './components/ui/nav-button';
import { NavGroup } from './components/ui/nav-group';
import type { AdminNavItem } from './types/admin-types';

interface AdminDashboardLayoutProps {
    children: React.ReactNode;
}

const navigationItems: AdminNavItem[] = [
    {
        key: 'overview',
        label: 'Overview',
        icon: <Icons.DatabaseIcon />,
        path: '/admin',
    },
    {
        key: 'draft',
        label: 'Draft Management',
        icon: <Icons.UsersIcon />,
        path: '/admin/draft',
    },
    {
        key: 'transfers',
        label: 'Transfer Management',
        icon: <Icons.SyncIcon />,
        path: '/admin/transfers',
    },
    {
        key: 'newPlayers',
        label: 'New Players',
        icon: <Icons.FileIcon />,
        path: '/admin/new-players',
    },
    {
        key: 'points',
        label: 'GameWeek Processing',
        icon: <Icons.ChartIcon />,
        path: '/admin/points',
    },
    {
        key: 'settings',
        label: 'Cache + Data',
        icon: <Icons.CloudIcon />,
        path: '/admin/settings',
    },
    {
        key: 'setupNewSeason',
        label: 'Setup New Season',
        icon: <Icons.CalendarIcon />,
        path: '/admin/setup-new-season',
    },
];

export const AdminLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
    const location = useLocation();

    const getActiveSection = () => {
        const path = location.pathname;
        if (path === '/admin') return 'overview';
        if (path.startsWith('/admin/draft')) return 'draft';
        if (path.startsWith('/admin/transfers')) return 'transfers';
        if (path.startsWith('/admin/new-players')) return 'newPlayers';
        if (path.startsWith('/admin/points')) return 'points';
        if (path.startsWith('/admin/settings')) return 'settings';
        if (path.startsWith('/admin/setup-new-season')) return 'setupNewSeason';
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
                        actions={<ActionBar align="right" />}
                    />
                </TwoColumnLayout.Header>

                <TwoColumnLayout.ContentContainer>
                    <TwoColumnLayout.Sidebar width="11rem">
                        <NavGroup direction="vertical">
                            {navigationItems.map((item) => (
                                <NavButton
                                    key={item.key}
                                    active={activeSection === item.key}
                                    href={item.path}
                                    icon={item.icon}
                                    label={item.label}
                                />
                            ))}
                        </NavGroup>
                    </TwoColumnLayout.Sidebar>

                    <TwoColumnLayout.Content>{children}</TwoColumnLayout.Content>
                </TwoColumnLayout.ContentContainer>
            </TwoColumnLayout.Container>
        </AppShell>
    );
};
