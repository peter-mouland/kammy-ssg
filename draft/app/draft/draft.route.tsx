/* Location: app/draft/draft.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { Draft } from './draft';
import type { DraftActionData, DraftLoaderData } from './types/draft-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Live Draft - Fantasy Football Draft' },
        { name: 'description', content: 'Live fantasy football draft interface' },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { loadDraftData } = await import('../draft/server/draft.server');
        const url = new URL(request.url);
        const loaderData = await loadDraftData(url);
        return data<DraftLoaderData>(loaderData);
    } catch (error) {
        console.error('Draft loader error:', error);
        throw new Response('Failed to load draft data', { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get('actionType');

        switch (actionType) {
            case 'makePick': {
                const { makeDraftPick } = await import('../draft/server/draft.server');
                const result = await makeDraftPick(formData);
                return data<DraftActionData>(result);
            }
            default:
                return data<DraftActionData>({ error: 'Invalid action type' });
        }
    } catch (error) {
        console.error('Draft action error:', error);
        return data<DraftActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform draft action',
        });
    }
}

export default Draft;
