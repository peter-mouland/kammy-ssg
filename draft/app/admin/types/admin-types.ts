// /admin/types/admin-types.ts

import type {
    DivisionData,
    UserTeamData,
    DraftOrderData,
    DraftStateData
} from '../../_shared/types';

// ==========================================
// ADMIN DASHBOARD DATA TYPES
// ==========================================

export interface AdminDashboardData {
    divisions: DivisionData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
}

// ==========================================
// ADMIN ACTION TYPES
// ==========================================

export type AdminActionType =
    | 'generateOrder'
    | 'clearOrder'
    | 'startDraft'
    | 'stopDraft'
    | 'syncDraft'
    | 'populateBootstrapData'
    | 'populateElementSummaries'
    | 'generateEnhancedDataFast'
    | 'generateGameWeekPoints'
    | 'forceRegenerateAllPoints'
    | 'clearFirestoreData'
    | 'getFirestoreStats';

export type ClearVariant = 'all' | 'fpl-only' | 'elements-only';

export interface AdminActionParams {
    actionType: AdminActionType;
    divisionId?: string;
    authToken?: string;
    variant?: ClearVariant;
}

export interface AdminActionResult {
    success: boolean;
    error?: string;
    message?: string;
    data?: any;
}

// ==========================================
// ADMIN NAVIGATION TYPES
// ==========================================

export type AdminSectionKey =
    | 'overview'
    | 'draft'
    | 'data'
    | 'points'
    | 'settings';

export interface AdminNavItem {
    key: AdminSectionKey;
    label: string;
    icon: React.ReactNode;
}

// ==========================================
// ADMIN UI COMPONENT TYPES
// ==========================================

export interface ActionCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    buttonText: string;
    actionType: AdminActionType;
    onExecute: (actionType: AdminActionType) => void;
    fetcher: any; // React Router useFetcher type
    recommended?: boolean;
    variant?: ClearVariant;
}

export interface StatusCardProps {
    icon: string;
    label: string;
    percentage: string;
    status: 'healthy' | 'warning' | 'critical';
}

export interface DraftCardProps {
    division: DivisionData;
    teams: UserTeamData[];
    orders: DraftOrderData[];
    draftState: DraftStateData | null;
}

export interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

// ==========================================
// ADMIN SECTION COMPONENT TYPES
// ==========================================

export interface OverviewSectionProps {
    // No props - fetches own data
}

export interface DraftSectionProps {
    divisions: DivisionData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
}

export interface DataManagementSectionProps {
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

export interface PointsScoringeSectionProps {
    // No props - handles own state
}

export interface SettingsSectionProps {
    // No props - placeholder component
}

// ==========================================
// CACHE STATUS TYPES
// ==========================================

export interface CacheStatusData {
    hasBootstrapData: boolean;
    hasElementSummaries: boolean;
    hasEnhancedData: boolean;
    missing?: {
        elements?: boolean;
        teams?: boolean;
        elementSummaries?: boolean;
        draftData?: boolean;
    };
    stats?: {
        [collection: string]: number;
    };
    estimate?: {
        clearTime: number;
        totalDocuments: number;
    };
    timestamp?: string;
}

// ==========================================
// FIRESTORE MANAGEMENT TYPES
// ==========================================

export interface FirestoreStats {
    collections: Record<string, number>;
    totalDocuments: number;
    estimatedClearTime: number;
}

export interface FirestoreClearOptions {
    variant: ClearVariant;
    collections?: string[];
}

// ==========================================
// GAMEWEEK POINTS TYPES
// ==========================================

export interface GameweekPointsResult {
    playerCount: number;
    currentGameweek: number;
    updatedGameweeks?: number[];
    processingTime?: number;
}

export interface GameweekPointsStatus {
    currentGameweek: number;
    lastUpdated?: Date;
    isProcessing: boolean;
    error?: string;
}

// ==========================================
// FIREBASE SYNC TYPES
// ==========================================

export interface FirebaseSyncResult {
    picksCount: number;
    currentPick: number;
    divisionId: string;
    timestamp: Date;
}

// ==========================================
// SYSTEM HEALTH TYPES
// ==========================================

export type SystemHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface SystemHealthData {
    status: SystemHealthStatus;
    services: {
        firestore: SystemHealthStatus;
        sheets: SystemHealthStatus;
        fpl: SystemHealthStatus;
        cache: SystemHealthStatus;
    };
    lastCheck: Date;
}

// ==========================================
// ADMIN LAYOUT COMPONENT TYPES
// ==========================================

export interface AdminSectionProps {
    title: string;
    icon?: React.ReactNode;
    description?: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    collapsible?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
}

export interface AdminGridProps {
    children: React.ReactNode;
    columns?: 'auto' | '1' | '2' | '3' | '4';
    gap?: 'sm' | 'md' | 'lg';
    minWidth?: string;
}

export interface AdminMessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export interface AdminContainerProps {
    children: React.ReactNode;
    spacing?: 'sm' | 'md' | 'lg';
}

export interface TwoColumnLayoutContainerProps {
    children: React.ReactNode;
    maxWidth?: string;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

export interface TwoColumnLayoutSidebarProps {
    children: React.ReactNode;
    width?: string;
    className?: string;
}

export interface TwoColumnLayoutContentProps {
    children: React.ReactNode;
    className?: string;
}

export interface AppShellProps {
    children: React.ReactNode;
    background?: 'light' | 'dark' | 'gray';
}

export interface NavGroupProps {
    children: React.ReactNode;
    direction?: 'vertical' | 'horizontal';
    gap?: 'sm' | 'md' | 'lg';
}

export interface ActionBarProps {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    gap?: 'sm' | 'md' | 'lg';
}

export interface RefreshButtonProps {
    onClick?: () => void;
    loading?: boolean;
    children?: React.ReactNode;
}

// ==========================================
// ADMIN DASHBOARD COMPONENT TYPES
// ==========================================

export interface AdminDashboardProps {
    // Props come from loader data
}

export interface AdminDashboardState {
    activeSection: AdminSectionKey;
    expandedSections: Set<string>;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type AdminFetcherState = 'idle' | 'submitting' | 'loading';

export interface AdminFetcherData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

// ==========================================
// TYPE GUARDS
// ==========================================

export function isAdminActionType(value: string): value is AdminActionType {
    const validActions: AdminActionType[] = [
        'generateOrder',
        'clearOrder',
        'startDraft',
        'stopDraft',
        'syncDraft',
        'populateBootstrapData',
        'populateElementSummaries',
        'generateEnhancedDataFast',
        'generateGameWeekPoints',
        'forceRegenerateAllPoints',
        'clearFirestoreData',
        'getFirestoreStats'
    ];
    return validActions.includes(value as AdminActionType);
}

export function isClearVariant(value: string): value is ClearVariant {
    return ['all', 'fpl-only', 'elements-only'].includes(value);
}

export function isAdminSectionKey(value: string): value is AdminSectionKey {
    return ['overview', 'draft', 'data', 'points', 'settings'].includes(value);
}

export function isSystemHealthStatus(value: string): value is SystemHealthStatus {
    return ['healthy', 'warning', 'critical', 'unknown'].includes(value);
}
