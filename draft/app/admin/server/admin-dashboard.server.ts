// /admin/server/admin-dashboard.server.ts
import { AdminDraftService } from './services/admin-draft-service';
import type { AdminDashboardData } from '../types';

/**
 * Main data loader for admin dashboard
 * This is only used by the parent route now, not for actions
 */
export async function getDraftAdminData(): Promise<AdminDashboardData> {
    return await AdminDraftService.getDraftAdminData();
}
