/* Location: app/admin/admin-overview.route.tsx */

import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { OverviewSection } from './components/sections/overview-section';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

interface AdminOutletContext {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, any> | null;
    loadedAt: string;
}

export default function AdminOverviewRoute() {
    const { systemStatus, sharedContext } = useOutletContext<AdminOutletContext>();
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

    return (
        <OverviewSection
            systemStatus={systemStatus}
            sharedContext={sharedContext}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
        />
    );
}
