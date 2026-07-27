import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center" data-testid="error-boundary">
          <h1 className="font-display font-black text-2xl mb-3">Something went wrong</h1>
          <p className="text-white/60 max-w-md mb-6 text-sm">
            An unexpected error occurred while loading this page. Please refresh or go back to the home page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 rounded-md bg-[#A3E635] text-black font-bold hover:bg-[#8CC91A] transition-colors"
              data-testid="error-reload-btn"
            >
              Reload
            </button>
            <a
              href="/"
              className="h-11 px-6 rounded-md border border-white/20 hover:bg-white/5 transition-colors flex items-center"
              data-testid="error-home-btn"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
