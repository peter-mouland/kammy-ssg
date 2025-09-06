/* Location: app/root.tsx */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import {
    isRouteErrorResponse,
    Links,
    type LinksFunction,
    Meta,
    type MetaFunction,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteError,
} from 'react-router';
import { DesktopNav, MobileNav } from './_shared/components/g-nav';
import designTokens from './design-tokens.css?url';
import globalStyles from './root.css?url';
import { WishlistProvider } from './wishlist/lib/use-wishlists';

export const meta: MetaFunction = () => {
    return [
        { title: 'Fantasy Football Draft' },
        { name: 'description', content: 'Division-based fantasy football draft application' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1' },
    ];
};

export const links: LinksFunction = () => [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
    },
    {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    },
    { rel: 'stylesheet', href: globalStyles },
    { rel: 'stylesheet', href: designTokens },
];

// Navigation configuration
const navigationItems = [
    { href: '/leagues', label: 'League Standings' },
    { href: '/teams?tab=all-teams', label: 'Teams' },
    { href: '/players', label: 'Players' },
    { href: '/transfers', label: 'Transfers' },
    { href: '/wishlists', label: 'Wishlists' },
    { href: '/draft', label: 'Draft' },
];

const logoConfig = {
    href: '/',
    text: 'Fantasy Draft',
};

export function Layout({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is fresh for 0ms for transfers (always stale, always refetch)
                        staleTime: 0,
                        // Keep data in cache for 5 minutes
                        gcTime: 1000 * 60 * 5,
                        // Retry failed requests 3 times
                        retry: 3,
                        // Retry delay increases exponentially
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        // Refetch on window focus for real-time updates
                        refetchOnWindowFocus: true,
                        // Refetch when component mounts
                        refetchOnMount: true,
                        // Don't refetch on reconnect by default
                        refetchOnReconnect: false,
                    },
                    mutations: {
                        // Retry mutations once
                        retry: 1,
                        retryDelay: 1000,
                    },
                },
            }),
    );
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <WishlistProvider>
                        <div className="header">
                            <div className="container">
                                {/* Desktop Navigation */}
                                <DesktopNav items={navigationItems} logo={logoConfig} />

                                {/* Mobile Navigation */}
                                <MobileNav items={navigationItems} logo={logoConfig} />
                            </div>
                        </div>

                        <main className="main">
                            <div className="container">{children}</div>
                        </main>

                        <footer className="footer">
                            <div className="container">
                                <p>&copy; 2025 Fantasy Football Draft Application</p>
                            </div>
                        </footer>
                    </WishlistProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="error">
                <h1>
                    {error.status} {error.statusText}
                </h1>
                <p>{error.data}</p>
            </div>
        );
    } else if (error instanceof Error) {
        return (
            <div className="error">
                <h1>Error</h1>
                <p>{error.message}</p>
                <p>The stack trace is:</p>
                <pre>{error.stack}</pre>
            </div>
        );
    } else {
        return (
            <div className="error">
                <h1>Unknown Error</h1>
                <p>An unexpected error occurred.</p>
            </div>
        );
    }
}
