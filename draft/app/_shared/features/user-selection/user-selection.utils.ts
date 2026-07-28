/* Location: app/_shared/lib/user-selection.utils.ts */

// Cookie configuration
import type { UserTeamsSheetData } from '../../types/league-types';

const USER_SELECTION_COOKIE_NAME = '__session'; // MUST BE __SESSION FOR FIREBASE!
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Server-side utility to get user selection from URL params or cookie
 * Priority: URL > Cookie > null
 */
export function getUserSelection(
    request: Request,
    params = {},
): {
    selectedUserId: string | null;
    requiresSelection: boolean;
} {
    const url = new URL(request.url);

    // 1. Check URL parameters first (highest priority)
    const urlUserId = params.userId || url.searchParams.get('userId') || url.searchParams.get('user');
    // console.log({ urlUserId });
    if (urlUserId) {
        return {
            selectedUserId: urlUserId,
            requiresSelection: false,
        };
    }

    // 2. Check cookie as fallback (secondary priority)
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        const cookieUserId = cookies[USER_SELECTION_COOKIE_NAME];

        if (cookieUserId) {
            return {
                selectedUserId: cookieUserId,
                requiresSelection: false,
            };
        }
    }

    // 3. No valid selection found
    return {
        selectedUserId: null,
        requiresSelection: true,
    };
}

/**
 * Client-side utility to get user selection from URL or cookie
 */
export function getClientUserSelection(): {
    selectedUserId: string | null;
    requiresSelection: boolean;
} {
    // 1. Check URL parameters first (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId') || urlParams.get('user');
    if (urlUserId) {
        return {
            selectedUserId: urlUserId,
            requiresSelection: false,
        };
    }

    // 2. Check cookie as fallback (secondary priority)
    const cookieUserId = getClientCookie(USER_SELECTION_COOKIE_NAME);
    if (cookieUserId) {
        return {
            selectedUserId: cookieUserId,
            requiresSelection: false,
        };
    }

    // 3. No valid selection found
    return {
        selectedUserId: null,
        requiresSelection: true,
    };
}

/**
 * Set user selection cookie and optionally update URL
 */
export function setUserSelection(userId: string, updateUrl: boolean = true): void {
    // Set cookie
    setClientCookie(USER_SELECTION_COOKIE_NAME, userId, COOKIE_MAX_AGE);

    // Optionally update URL
    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('userId', userId);
        window.history.replaceState({}, '', url.toString());
    }
}

/**
 * Clear user selection from cookie and URL
 */
export function clearUserSelection(): void {
    // Clear cookie
    setClientCookie(USER_SELECTION_COOKIE_NAME, '', -1);

    // Clear URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('userId');
    url.searchParams.delete('user');
    window.history.replaceState({}, '', url.toString());
}

/**
 * Create response headers to set user selection cookie
 */
export function createUserSelectionHeaders(userId: string): HeadersInit {
    const cookieValue = `${USER_SELECTION_COOKIE_NAME}=${userId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly=false`;
    return {
        'Set-Cookie': cookieValue,
    };
}

/**
 * Update URL with user selection (for redirects)
 */
export function addUserToUrl(url: string, userId: string): string {
    const urlObj = new URL(url, 'http://dummy.com'); // Base URL needed for relative URLs
    urlObj.searchParams.set('userId', userId);
    return urlObj.pathname + urlObj.search;
}

// Helper functions
function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
            cookies[name] = rest.join('=');
        }
    });

    return cookies;
}

function getClientCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

function setClientCookie(name: string, value: string, maxAge: number): void {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=${value}; Path=/; SameSite=Lax`;
    if (maxAge > 0) {
        cookieString += `; Max-Age=${maxAge}`;
    } else {
        cookieString += `; Max-Age=${maxAge}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    document.cookie = cookieString;
}

/**
 * Validation helper to check if user selection is valid
 */
export function isValidUserSelection(userId: string | null, users: UserTeamsSheetData[]): boolean {
    if (!userId) return false;
    return users.some((u) => u.userId === userId);
}

/**
 * Get user by ID with fallback
 */
export function getUserById(userId: string | null, users: UserTeamsSheetData[]): UserTeamsSheetData | null {
    if (!userId) return null;
    return users.find((u) => u.userId === userId) || null;
}
