// app/_shared/types/common-types.ts

/**
 * Common types used across multiple domains
 * These are truly shared types that don't belong to a specific domain
 */

/**
 * API response wrapper types
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

/**
 * Error handling types
 */
export interface AppError {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
}

export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'INTERNAL_SERVER_ERROR'
    | 'FPL_API_ERROR'
    | 'SHEETS_API_ERROR'
    | 'FIREBASE_ERROR'
    | 'MISSING_SPREADSHEET_ID';
