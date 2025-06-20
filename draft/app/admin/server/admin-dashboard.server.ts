/* Location: app/admin/server/admin-dashboard.server.ts */

import type { AdminDashboardData } from '../types/admin-types';
// /admin/server/admin-dashboard.server.ts
import { AdminDraftService } from './services/admin-draft-service';

/**
 * Main data loader for admin dashboard
 * This is only used by the parent route now, not for actions
 */
export async function getDraftAdminData(): Promise<AdminDashboardData> {
    return await AdminDraftService.getDraftAdminData();
}
