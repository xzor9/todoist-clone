import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div style={{ padding: '2rem', color: 'red' }}>
                    <h1>Something went wrong.</h1>
                    {isDev ? (
                        <details style={{ whiteSpace: 'pre-wrap' }}>
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                    ) : (
                        <p>We're sorry, but an unexpected error has occurred. Please try refreshing the page.</p>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
