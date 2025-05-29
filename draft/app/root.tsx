import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    isRouteErrorResponse,
    useRouteError,
    type MetaFunction,
    type LinksFunction,
} from "react-router";

import globalStyles from "./root.css?url";

export const meta: MetaFunction = () => {
    return [
        { title: "Fantasy Football Draft" },
        { name: "description", content: "Division-based fantasy football draft application" },
        { name: "viewport", content: "width=device-width,initial-scale=1" },
    ];
};

export const links: LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    },
    { rel: "stylesheet", href: globalStyles },
];

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
        <div className="header">
            <div className="container">
                <nav className="nav">
                    <a href="/" className="logo">Fantasy Draft</a>
                    <a href="/">Dashboard</a>
                    <a href="/my-team">League Standings</a>
                    <a href="/draft">Draft</a>
                </nav>
            </div>
        </div>

        <main className="main">
            <div className="container">
                {children}
            </div>
        </main>

        <footer className="footer">
            <div className="container">
                <p>&copy; 2025 Fantasy Football Draft Application</p>
            </div>
        </footer>

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
