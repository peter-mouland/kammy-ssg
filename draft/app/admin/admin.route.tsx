import {
    type MetaFunction,
    type LoaderFunctionArgs,
    // type ActionFunctionArgs,
    data,
    Outlet
} from 'react-router';
// import { requestFormData } from '../_shared/lib/form-data';
import { AdminLayout } from './admin.layout';

export const meta: MetaFunction = () => {
    return [
        { title: "Draft Setup - Fantasy Football Draft" },
        { name: "description", content: "Generate and manage draft orders for fantasy football league" },
    ];
};

// used to debug
// export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
//     try {
//         const formData = await requestFormData({ request, context });
//
//         // Log everything to see what's being submitted to the parent route
//         console.log('🔍 PARENT ROUTE ACTION CALLED:');
//         console.log('URL:', request.url);
//         console.log('Method:', request.method);
//
//         // Log all form data
//         const entries: string[][] = [];
//         if (formData instanceof FormData) {
//             for (const [key, value] of formData.entries()) {
//                 entries.push([key, value.toString()]);
//             }
//         } else {
//             // Our custom form data wrapper
//             const actionType = formData.get("actionType");
//             const divisionId = formData.get("divisionId");
//             const variant = formData.get("variant");
//
//             console.log('ActionType:', actionType);
//             console.log('DivisionId:', divisionId);
//             console.log('Variant:', variant);
//         }
//
//         console.log('Form entries:', entries);
//         console.log('---');
//
//         return data({
//             success: false,
//             error: "This action was submitted to the parent route - it should go to a child route instead",
//             debug: {
//                 url: request.url,
//                 method: request.method,
//                 entries
//             }
//         });
//
//     } catch (error) {
//         console.error("Parent route action error:", error);
//         return data({
//             error: "Parent route action failed",
//             originalError: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const { getDraftAdminData } = await import("./server/admin-dashboard.server");
        const draftAdminData = await getDraftAdminData();
        return data(draftAdminData);
    } catch (error) {
        console.error("Draft admin loader error:", error);
        throw new Response("Failed to load draft setup data", { status: 500 });
    }
}

export default function AdminRoute() {
    return (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    );
}
