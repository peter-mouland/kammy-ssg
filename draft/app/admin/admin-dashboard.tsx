import React, { useState } from 'react';
import { useLoaderData } from 'react-router';
import * as Icons from './components/icons/admin-icons'
import { SystemHealthBadge } from './components/ui/system-health-badge'
import { NavButton } from './components/ui/nav-button'
import { RefreshButton } from './components/ui/refresh-button'
import { NavGroup } from './components/ui/nav-group'
import { AdminSection } from './components/layout/admin-section'
import { AppShell } from './components/layout/app-shell'
import { ActionBar } from './components/layout/action-bar'
import { TwoColumnLayout } from './components/layout/two-column-layout'
import { OverviewSection } from './components/sections/overview-section'
import { DraftSection } from './components/sections/draft-section'
import { DataManagementSection } from './components/sections/data-management-section'
import { PointsScoringSection } from './components/sections/points-scoring-section'
import { SettingsSection } from './components/sections/settings-section'

export const AdminDashboard = () => {
    const { divisions, draftOrders, userTeamsByDivision, draftState } = useLoaderData();
    const [activeSection, setActiveSection] = useState('overview');
    const [expandedSections, setExpandedSections] = useState(new Set(['cache-management']));

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return <OverviewSection />;
            case 'draft':
                return (
                    <DraftSection
                        divisions={divisions}
                        draftOrders={draftOrders}
                        userTeamsByDivision={userTeamsByDivision}
                        draftState={draftState}
                    />
                );
            case 'data':
                return (
                    <DataManagementSection
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                    />
                );
            case 'points':
                return <PointsScoringSection />;
            case 'settings':
                return <SettingsSection />;
            default:
                return <OverviewSection />;
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
                                <RefreshButton />
                            </ActionBar>
                        }
                    />
                </TwoColumnLayout.Header>

                <TwoColumnLayout.ContentContainer>
                    <TwoColumnLayout.Sidebar width="16rem">
                        <NavGroup direction="vertical">
                            <NavButton
                                active={activeSection === 'overview'}
                                onClick={() => setActiveSection('overview')}
                                icon={<Icons.BarChartIcon />}
                                label="Overview"
                            />
                            <NavButton
                                active={activeSection === 'draft'}
                                onClick={() => setActiveSection('draft')}
                                icon={<Icons.UsersIcon />}
                                label="Draft Management"
                            />
                            <NavButton
                                active={activeSection === 'data'}
                                onClick={() => setActiveSection('data')}
                                icon={<Icons.DatabaseIcon />}
                                label="Data Management"
                            />
                            <NavButton
                                active={activeSection === 'points'}
                                onClick={() => setActiveSection('points')}
                                icon={<Icons.ChartIcon />}
                                label="Points & Scoring"
                            />
                            <NavButton
                                active={activeSection === 'settings'}
                                onClick={() => setActiveSection('settings')}
                                icon={<Icons.SettingsIcon />}
                                label="Settings"
                            />
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
