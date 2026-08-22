/* Location: app/root.tsx */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import {
    Links,
    type LinksFunction,
    Meta,
    type MetaFunction,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useRouteError,
} from 'react-router';
import { DesktopNav, MobileNav } from './_shared/components/g-nav';
import { RouteError } from './_shared/components/route-error';
import { fakeNowIso } from './_shared/lib/clock';
import { fplApiCache } from './_shared/lib/fpl/api-cache';
import designTokens from './design-tokens.css?url';
import globalStyles from './root.css?url';
import { calculateScoringStatus, PendingGamesModal, ScoringStatusBadge } from './scoring/feature/scoring-status';
import { GameweekPointsService } from './scoring/index.server';
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

export async function loader() {
    try {
        const gameweekService = new GameweekPointsService();

        // Fetch data with individual error handling
        const [metadataResult, fixturesResult, currentGameweekNumberResult, teamsResult] = await Promise.allSettled([
            gameweekService.getPointsStatus(),
            fplApiCache.getFplFixtures(),
            fplApiCache.getScoringGameweek(),
            fplApiCache.getFplTeams(),
        ]);

        // Extract values or use defaults
        const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : { lastGenerated: null };
        const fixtures = fixturesResult.status === 'fulfilled' ? fixturesResult.value : [];
        const currentGameweekNumber =
            currentGameweekNumberResult.status === 'fulfilled' ? currentGameweekNumberResult.value : 0;
        const teams = teamsResult.status === 'fulfilled' ? teamsResult.value : [];

        // Log any failures for debugging
        if (metadataResult.status === 'rejected') console.error('Failed to load metadata:', metadataResult.reason);
        if (fixturesResult.status === 'rejected') console.error('Failed to load fixtures:', fixturesResult.reason);
        if (currentGameweekNumberResult.status === 'rejected')
            console.error('Failed to load current gameweek:', currentGameweekNumberResult.reason);
        if (teamsResult.status === 'rejected') console.error('Failed to load teams:', teamsResult.reason);

        // Calculate scoring status using the scoring-status feature. Whether the gameweek
        // has finished is derived from the fixtures inside, not read off
        // `currentGameweekData.fplEvent.finished` -- that one is frozen at whenever an
        // admin last populated bootstrap data.
        const { status } = calculateScoringStatus({
            lastGenerated: metadata?.lastGenerated || null,
            currentGameweekNumber: currentGameweekNumber || 0,
            fixtures: fixtures || [],
        });

        // Get pending games (not yet started) in current gameweek
        let pendingGames = [];
        try {
            if (fixtures && Array.isArray(fixtures) && teams && Array.isArray(teams) && currentGameweekNumber) {
                const currentGameweekFixtures = fixtures.filter((f) => f?.event === currentGameweekNumber);
                pendingGames = currentGameweekFixtures
                    .filter((fixture) => fixture && !fixture.started)
                    .map((fixture) => {
                        const homeTeam = teams.find((t) => t?.id === fixture.team_h);
                        const awayTeam = teams.find((t) => t?.id === fixture.team_a);
                        return {
                            id: fixture.id,
                            homeTeam: homeTeam?.name || 'Unknown',
                            awayTeam: awayTeam?.name || 'Unknown',
                            kickoffTime: fixture.kickoff_time || '',
                        };
                    });
            }
        } catch (pendingGamesError) {
            console.error('Error processing pending games:', pendingGamesError);
            pendingGames = [];
        }

        return {
            scoresPublishedAt: metadata?.lastGenerated || null,
            scoresStatus: status,
            pendingGames,
            fakeNow: fakeNowIso(),
        };
    } catch (error) {
        console.error('Error in root loader:', error);
        return {
            scoresPublishedAt: null,
            // Not 'up-to-date'. We know nothing here, and the badge's whole job is to
            // refuse to say everything is fine unless it has seen that it is.
            scoresStatus: 'pending' as const,
            pendingGames: [],
            fakeNow: fakeNowIso(),
        };
    }
}

// Navigation configuration
const navigationItems = [
    { href: '/leagues', label: 'League Standings' },
    { href: '/teams?tab=all-teams', label: 'Teams' },
    { href: '/transfers', label: 'Transfers' },
    { href: '/cup', label: 'Cup' },
    { href: '/wishlists', label: 'Wishlists' },
    { href: '/draft', label: 'Draft' },
];

const logoConfig = {
    href: '/',
    text: 'Fantasy Draft',
};

/**
 * Hands the server's fake date to the browser, ahead of hydration.
 *
 * Without it the server renders at the harness date and the client re-renders at the real
 * one, so anything date-dependent -- a deadline countdown, an open-or-locked transfer form
 * -- mismatches. `fakeNow` is null in production, so this never renders there.
 */
function FakeNowScript({ iso }: { iso: string }) {
    return (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: an ISO string this app generated, and it has to run before hydration
        // biome-ignore lint/style/useNamingConvention: __html is React's own prop name
        <script dangerouslySetInnerHTML={{ __html: `window.__KAMMY_NOW__=${JSON.stringify(iso)}` }} />
    );
}

export function Layout({ children }: { children: React.ReactNode }) {
    const data = useLoaderData<typeof loader>();
    const [showPendingGamesModal, setShowPendingGamesModal] = React.useState(false);
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

    const handleStatusBadgeClick = () => {
        if (data?.scoresStatus === 'pending') {
            setShowPendingGamesModal(true);
        }
    };

    // Only render status badge if we have valid data
    const statusBadge =
        data?.scoresStatus &&
        (data.scoresStatus === 'up-to-date' || data.scoresStatus === 'pending' || data.scoresStatus === 'stale') ? (
            <ScoringStatusBadge status={data.scoresStatus} variant="dot" onClick={handleStatusBadgeClick} />
        ) : null;

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
                {data?.fakeNow ? <FakeNowScript iso={data.fakeNow} /> : null}
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <WishlistProvider>
                        <div className="header">
                            <div className="container">
                                {/* Desktop Navigation */}
                                <DesktopNav items={navigationItems} logo={logoConfig} statusBadge={statusBadge} />

                                {/* Mobile Navigation */}
                                <MobileNav items={navigationItems} logo={logoConfig} statusBadge={statusBadge} />
                            </div>
                        </div>

                        <main className="main">
                            <div className="container">{children}</div>
                        </main>

                        <Footer onStatusClick={handleStatusBadgeClick} />

                        {/* Pending Games Modal */}
                        {showPendingGamesModal && data?.pendingGames && (
                            <PendingGamesModal
                                games={data.pendingGames}
                                onClose={() => setShowPendingGamesModal(false)}
                            />
                        )}
                    </WishlistProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

interface FooterProps {
    onStatusClick: () => void;
}

function Footer({ onStatusClick }: FooterProps) {
    const data = useLoaderData<typeof loader>();

    const formatDate = (isoString: string | null) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(date);
    };

    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; 2025 Fantasy Football Draft Application</p>
                {data?.scoresPublishedAt && data?.scoresStatus && (
                    <p className="score-status">
                        <ScoringStatusBadge status={data.scoresStatus} variant="label" onClick={onStatusClick}>
                            Scores updated: {formatDate(data.scoresPublishedAt)}
                        </ScoringStatusBadge>
                    </p>
                )}
            </div>
        </footer>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary() {
    const error = useRouteError();

    // Everything specific lives in RouteError, so every page fails the same way and a
    // reader gets the real cause rather than "An unexpected error occurred".
    return <RouteError error={error} />;
}
