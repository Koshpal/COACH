import React from 'react';

interface Props { children: React.ReactNode; resetKey?: string }
interface State { failed: boolean }

/**
 * Last line of defence: a render error in one screen shows a recoverable message instead of a blank page.
 * `resetKey` (the current route) clears the error when the coach navigates somewhere else.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Deliberately only the technical details: never log page content, which can include employee data.
    console.error('[ui] render error:', error.message, info.componentStack?.split('\n').slice(0, 4).join('\n'));
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-jakarta text-[22px] font-semibold text-[var(--color-text-primary)]">Something went wrong on this page</h1>
        <p className="max-w-md font-outfit text-[14px] text-[var(--color-text-secondary)]">
          Your notes are saved as you type, so nothing on the server was lost. Try reloading the page, or go back to the dashboard.
        </p>
        <div className="flex gap-3">
          <button className="rounded-[10px] bg-[var(--color-primary)] px-4 py-2 font-outfit text-[14px] font-medium text-white" onClick={() => window.location.reload()}>Reload</button>
          <a className="rounded-[10px] border border-[var(--color-border-primary)] px-4 py-2 font-outfit text-[14px] text-[var(--color-text-primary)]" href="/dashboard">Dashboard</a>
        </div>
      </div>
    );
  }
}
