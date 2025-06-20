/* Location: app/admin/admin-overview.route.tsx */

import React, { useState } from 'react';
import { type ActionFunctionArgs, data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { OverviewSection } from './components/sections/overview-section';
import type { AdminActionType, ClearVariant } from './types/admin-types';

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get('actionType')?.trim() as AdminActionType;
        const variant = formData.get('variant')?.trim() as ClearVariant;

        if (!actionType) {
            return data<ActionData>({ error: 'Action type is required' });
        }

        const { handleOverviewActions } = await import('./server/overview-actions.server');

        const result = await handleOverviewActions({
            actionType: actionType,
            variant: variant,
        });

        return data<ActionData>(result);
    } catch (error) {
        console.error('Overview action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform overview action',
        });
    }
}

export default function AdminOverviewRoute() {
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

    return <OverviewSection expandedSections={expandedSections} toggleSection={toggleSection} />;
}
