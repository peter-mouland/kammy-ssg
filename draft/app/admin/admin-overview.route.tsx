/* Location: app/admin/admin-overview.route.tsx */

import { useState } from 'react';
import { type ActionFunctionArgs, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { OverviewSection } from './components/sections/overview-section';

/**
 * Load admin system status using the unified AdminOrchestrator
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Use the updated AdminOrchestrator which now delegates to system-status.service.ts
    const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
    const orchestrator = new AdminOrchestrator();
    const systemStatus = await orchestrator.getSystemStatus();
    const sharedContext = await orchestrator.getSharedContext();

    return {
        sharedContext,
        systemStatus,
    };
}

export async function action({ request, context }: ActionFunctionArgs) {}

export default function AdminOverviewRoute() {
    const { systemStatus, sharedContext } = useLoaderData();
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
