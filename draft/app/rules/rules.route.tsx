/* Location: app/rules/rules.route.tsx */

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { buildRulesEmbedUrl, buildRulesPubUrl, fetchRulesHtml } from './lib/fetch-rules-html';
import { RulesPage } from './rules.page';

export type RulesView = 'embed' | 'native';

export type RulesLoaderData = {
    view: RulesView;
    pubId: string | null;
    embedUrl: string | null;
    pubUrl: string | null;
    nativeHtml: string | null;
    nativeError: string | null;
};

export const meta: MetaFunction = () => {
    return [
        { title: 'Rules - Fantasy Football Draft' },
        { name: 'description', content: 'League rules for Fantasy Football Draft' },
    ];
};

function parseView(value: string | null): RulesView {
    return value === 'native' ? 'native' : 'embed';
}

export async function loader({ request }: LoaderFunctionArgs): Promise<RulesLoaderData> {
    const url = new URL(request.url);
    const view = parseView(url.searchParams.get('view'));
    const pubId = process.env.GOOGLE_RULES_DOC_PUB_ID?.trim() || null;

    if (!pubId) {
        return {
            view,
            pubId: null,
            embedUrl: null,
            pubUrl: null,
            nativeHtml: null,
            nativeError: null,
        };
    }

    const embedUrl = buildRulesEmbedUrl(pubId);
    const pubUrl = buildRulesPubUrl(pubId);

    if (view !== 'native') {
        return {
            view,
            pubId,
            embedUrl,
            pubUrl,
            nativeHtml: null,
            nativeError: null,
        };
    }

    try {
        const nativeHtml = await fetchRulesHtml(pubId);
        return {
            view,
            pubId,
            embedUrl,
            pubUrl,
            nativeHtml,
            nativeError: null,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load rules';
        console.error('Failed to fetch rules HTML:', error);
        return {
            view,
            pubId,
            embedUrl,
            pubUrl,
            nativeHtml: null,
            nativeError: message,
        };
    }
}

export default RulesPage;
