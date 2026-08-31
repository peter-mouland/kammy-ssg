/* Location: app/rules/lib/rules-doc-urls.ts */

const PUB_BASE = 'https://docs.google.com/document/d/e';

export function buildRulesPubUrl(pubId: string): string {
    return `${PUB_BASE}/${pubId}/pub`;
}

export function buildRulesEmbedUrl(pubId: string): string {
    return `${buildRulesPubUrl(pubId)}?embedded=true`;
}
