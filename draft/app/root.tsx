/* Location: app/root.tsx */

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
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
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

                    <ScrollRestoration />
                    <Scripts />
                </WishlistProvider>
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
