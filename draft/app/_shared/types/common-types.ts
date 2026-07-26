/**
 * Error handling types
 */
export interface AppError {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
}
