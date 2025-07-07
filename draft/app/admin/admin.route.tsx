/* Location: app/admin/admin.route.tsx */

import { data, type LoaderFunctionArgs, type MetaFunction, Outlet } from 'react-router';
import { AdminLayout } from './admin.layout';

export const meta: MetaFunction = () => {
    return [
        { title: 'Draft Setup - Fantasy Football Draft' },
        { name: 'description', content: 'Generate and manage draft orders for fantasy football league' },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {}

export default function AdminRoute() {
    return (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    );
}
