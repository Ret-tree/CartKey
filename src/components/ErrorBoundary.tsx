import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CartKey error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReset = () => {
    if (confirm('This will clear all CartKey data and reload the app. Continue?')) {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('ck:'));
      keys.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-warm-50 p-6 font-sans">
          <div className="max-w-sm w-full">
            <div className="w-14 h-14 rounded-2xl bg-forest-900 flex items-center justify-center mb-5 shadow-lg shadow-forest-900/20">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L8 12V28L20 36L32 28V12L20 4Z" stroke="#C9A227" strokeWidth="2" fill="none"/>
                <circle cx="20" cy="18" r="4" fill="#C9A227"/>
                <path d="M20 22V32" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-900">Something went wrong</h1>
            <p className="text-sm text-forest-900/55 mt-2 leading-relaxed">
              CartKey hit an unexpected error. Your data is safe — try reloading the app first.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-lg bg-warm-100 border border-warm-200">
                <p className="text-[11px] font-mono text-forest-900/70 break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3.5 rounded-xl bg-forest-900 text-brass-100 font-semibold text-base"
            >
              Reload App
            </button>

            <button
              onClick={this.handleReset}
              className="mt-2 w-full py-2.5 rounded-xl bg-warm-100 text-forest-900/55 font-semibold text-sm"
            >
              Try to Continue
            </button>

            <button
              onClick={this.handleHardReset}
              className="mt-4 w-full text-xs text-red-500 underline"
            >
              Reset all CartKey data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
