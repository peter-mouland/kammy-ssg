/* Location: app/rules/lib/fetch-rules-html.ts */

const PUB_BASE = 'https://docs.google.com/document/d/e';

export function buildRulesPubUrl(pubId: string): string {
    return `${PUB_BASE}/${pubId}/pub`;
}

export function buildRulesEmbedUrl(pubId: string): string {
    return `${buildRulesPubUrl(pubId)}?embedded=true`;
}

/**
 * Fetch the published Google Doc HTML and extract the document body
 * (#contents), including Google's embedded styles for class formatting.
 */
export async function fetchRulesHtml(pubId: string): Promise<string> {
    const response = await fetch(buildRulesPubUrl(pubId), {
        headers: {
            Accept: 'text/html',
            'User-Agent': 'draftff-rules-page/1.0',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch rules doc (${response.status})`);
    }

    const html = await response.text();
    return extractContentsHtml(html);
}

export function extractContentsHtml(html: string): string {
    const startMarker = '<div id="contents">';
    const start = html.indexOf(startMarker);
    if (start === -1) {
        throw new Error('Could not find rules document contents');
    }

    // Published docs place scripts immediately after the contents block.
    const scriptAfter = html.indexOf('<script', start + startMarker.length);
    const end = scriptAfter === -1 ? html.indexOf('</body>', start) : scriptAfter;
    if (end === -1) {
        throw new Error('Could not parse rules document contents');
    }

    const contents = html.slice(start, end);
    // Drop any scripts that might appear inside the contents block.
    return contents.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
}
