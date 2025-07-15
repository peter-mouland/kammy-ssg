// app/_shared/components/error-boundary.tsx

import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('🚨 Error Boundary Caught:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            // Log the actual data that caused the error
            timestamp: new Date().toISOString(),
        });

        this.setState({
            error,
            errorInfo,
        });

        // Send to error reporting service in production
        if (process.env.NODE_ENV === 'production') {
            // Report to Sentry, LogRocket, etc.
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div style={{ padding: '20px', background: '#fee', border: '1px solid #f00' }}>
                        <h2>Something went wrong</h2>
                        <p>Error: {this.state.error?.message}</p>
                        <details>
                            <summary>Error Details</summary>
                            <pre>{this.state.error?.stack}</pre>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </details>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
