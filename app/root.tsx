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
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <Meta />
            <Links />
            <style>{`
            @keyframes tilt-n-move-shaking {
                0% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(5px, 5px) rotate(5deg); }
                50% { transform: translate(0, 0) rotate(0eg); }
                75% { transform: translate(-5px, 5px) rotate(-5deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }


          /* CSS Reset and System Font Setup */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          /* Force system font on html and body */
          html {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            font-feature-settings: "liga" 1, "kern" 1;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-size: 16px;
          }

          /* Ensure all text elements inherit the system font */
          *, *::before, *::after {
            font-family: inherit !important;
          }

          /* Specific font settings for different elements */
          h1, h2, h3, h4, h5, h6 {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
            font-weight: 600;
            margin: 0;
          }

          p, span, div, section, article, main, aside, nav, header, footer {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
          }

          button, input, select, textarea {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
          }

          /* Override any browser defaults */
          table, th, td, tr {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif !important;
          }

          /* Ensure emojis render properly with emoji fonts first, then system fonts */
          .emoji {
            font-family: Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji,
              -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif !important;
            font-style: normal;
            font-variant-emoji: emoji;
          }

          /* Icon fallbacks for when emojis dont work */
          .icon-trophy::before { content: "🏆"; }
          .icon-chart::before { content: "📊"; }
          .icon-team::before { content: "👥"; }
          .icon-settings::before { content: "⚙️"; }
          .icon-target::before { content: "🎯"; }
          .icon-stats::before { content: "📈"; }
          .icon-active::before { content: "🟢"; }
          .icon-inactive::before { content: "🔴"; }
          .icon-timer::before { content: "⏰"; }
          .icon-search::before { content: "🔍"; }
          .icon-draft::before { content: "📋"; }
          .icon-refresh::before { content: "🔄"; }
          .icon-delete::before { content: "🗑️"; }
          .icon-generate::before { content: "🎲"; }
          .icon-start::before { content: "🚀"; }
          .icon-stop::before { content: "🛑"; }
          .icon-instructions::before { content: "📝"; }
          .icon-check::before { content: "✅"; }
          .icon-error::before { content: "❌"; }
          .icon-warning::before { content: "⚠️"; }

          /* Fallback text for critical icons when emojis fail */
          @supports not (font-variant-emoji: emoji) {
            .icon-trophy::before { content: "[TROPHY]"; }
            .icon-chart::before { content: "[CHART]"; }
            .icon-team::before { content: "[TEAM]"; }
            .icon-active::before { content: "[ACTIVE]"; }
            .icon-inactive::before { content: "[INACTIVE]"; }
            .icon-check::before { content: "[OK]"; }
            .icon-error::before { content: "[ERROR]"; }
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .header {
            background: #1e293b;
            color: white;
            padding: 1rem 0;
            margin-bottom: 2rem;
          }

          .nav {
            display: flex;
            gap: 2rem;
            align-items: center;
          }

          .nav a {
            color: #cbd5e1;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            transition: all 0.2s;
          }

          .nav a:hover,
          .nav a.active {
            color: white;
            background: #334155;
          }

          .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: white !important;
            background: none !important;
          }

          .main {
            min-height: calc(100vh - 200px);
          }

          .footer {
            background: #f1f5f9;
            padding: 2rem 0;
            margin-top: 4rem;
            text-align: center;
            color: #64748b;
          }

          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;

            &:disabled {
                cursor: default;
            }
          }

          .btn-primary {
            background: #3b82f6;
            color: white;
          }

          .btn-primary:hover {
            background: #2563eb;
          }

          .btn-secondary {
            background: #6b7280;
            color: white;
          }

          .btn-secondary:hover {
            background: #4b5563;
          }

          .btn-danger {
            background: #ef4444;
            color: white;
          }

          .btn-danger:hover {
            background: #dc2626;
          }

          .card {
            background: white;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }

          .card-header {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 1rem;
          }

          .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
          }

          .error {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
          }

          .success {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            color: #166534;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
          }

          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #6b7280;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }

          .table th,
          .table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          .table th {
            font-weight: 600;
            background: #f8fafc;
          }

          .table tr:hover {
            background: #f8fafc;
          }

          .position-gk { color: #10B981; }
          .position-fb, .position-cb { color: #3B82F6; }
          .position-mid { color: #8B5CF6; }
          .position-wa { color: #F59E0B; }
          .position-ca { color: #EF4444; }

          .draft-active {
            border-left: 4px solid #10B981;
            background: #f0fdf4;
          }

          .draft-completed {
            opacity: 0.6;
          }

          .pick-timer {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            padding: 0.75rem;
            border-radius: 0.375rem;
            text-align: center;
            font-weight: 600;
          }

          .pick-timer.urgent {
            background: #fee2e2;
            border-color: #f87171;
            color: #991b1b;
          }

          @media (max-width: 768px) {
            .nav {
              flex-direction: column;
              gap: 1rem;
            }

            .container {
              padding: 0 0.5rem;
            }

            .table {
              font-size: 0.875rem;
            }

            .table th,
            .table td {
              padding: 0.5rem;
            }
          }
        `}</style>
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
