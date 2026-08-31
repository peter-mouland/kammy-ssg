/* Location: app/rules/rules.route.tsx */

import type { MetaFunction } from 'react-router';
import { buildRulesEmbedUrl, buildRulesPubUrl } from './lib/rules-doc-urls';
import { RulesPage } from './rules.page';

export type RulesLoaderData = {
    pubId: string | null;
    embedUrl: string | null;
    pubUrl: string | null;
};

export const meta: MetaFunction = () => {
    return [
        { title: 'Rules - Fantasy Football Draft' },
        { name: 'description', content: 'League rules for Fantasy Football Draft' },
    ];
};

export async function loader(): Promise<RulesLoaderData> {
    const pubId = process.env.GOOGLE_RULES_DOC_PUB_ID?.trim() || null;

    if (!pubId) {
        return {
            pubId: null,
            embedUrl: null,
            pubUrl: null,
        };
    }

    return {
        pubId,
        embedUrl: buildRulesEmbedUrl(pubId),
        pubUrl: buildRulesPubUrl(pubId),
    };
}

export default RulesPage;
