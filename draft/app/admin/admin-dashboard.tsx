// /admin/admin-dashboard.tsx
import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import * as Icons from './components/icons/admin-icons';
import { SystemHealthBadge } from './components/ui/system-health-badge'
import { NavButton } from './components/ui/nav-button'
import { NavGroup } from './components/ui/nav-group'
import { RefreshButton } from './components/ui/refresh-button'

import { AdminSection } from './components/layout/admin-section'
import { AppShell } from './components/layout/app-shell'
import { ActionBar } from './components/layout/action-bar'
import { TwoColumnLayout } from './components/layout/two-column-layout'

import { OverviewSection } from './components/sections/overview-section'
import { DraftSection } from './components/sections/draft-section'
import { PointsScoringSection } from './components/sections/points-scoring-section'
import { SettingsSection } from './components/sections/settings-section'
import type {
    AdminDashboardData,
    AdminSectionKey,
    AdminNavItem
} from './types';

const navigationItems: AdminNavItem[] = [
    {
        key: 'overview',
        label: 'Overview',
        icon: <Icons.DatabaseIcon />
    },
    {
        key: 'draft',
        label: 'Draft Management',
        icon: <Icons.UsersIcon />
    },
    {
        key: 'points',
        label: 'Points & Scoring',
        icon: <Icons.ChartIcon />
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: <Icons.SettingsIcon />
    }
];

export const AdminDashboard: React.FC = () => {
    const {
        divisions,
        draftOrders,
        userTeamsByDivision,
        draftState
    } = useLoaderData() as AdminDashboardData;

    const revalidator = useRevalidator();
    const [activeSection, setActiveSection] = useState<AdminSectionKey>('overview');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (section: string): void => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleRefreshAll = () => {
        // Revalidate the route data (refetch from loader)
        revalidator.revalidate();
    };

    const renderContent = (): React.ReactNode => {
        switch (activeSection) {
            case 'overview':
                return <OverviewSection
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                />;
            case 'draft':
                return (
                    <DraftSection
                        divisions={divisions}
                        draftOrders={draftOrders}
                        userTeamsByDivision={userTeamsByDivision}
                        draftState={draftState}
                    />
                );
            case 'points':
                return <PointsScoringSection />;
            case 'settings':
                return <SettingsSection />;
            default:
                return <OverviewSection
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                />;
        }
    };

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
                                    onClick={() => setActiveSection(item.key)}
                                    icon={item.icon}
                                    label={item.label}
                                />
                            ))}
                        </NavGroup>
                    </TwoColumnLayout.Sidebar>

                    <TwoColumnLayout.Content>
                        {renderContent()}
                    </TwoColumnLayout.Content>
                </TwoColumnLayout.ContentContainer>
            </TwoColumnLayout.Container>
        </AppShell>
    );
};

export default AdminDashboard;
