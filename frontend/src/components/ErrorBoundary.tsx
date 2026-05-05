import { Component } from "react";
import type { ReactNode } from "react";

interface Props  { children: ReactNode; }
interface State  { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-[#ef4444] text-xl">⚠</span>
            </div>
            <h1 className="text-xl font-semibold text-[#fafafa] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#71717a] mb-5">
              An unexpected error occurred. Refreshing the page usually fixes this.
            </p>
            {this.state.error && (
              <p className="text-xs text-[#52525b] font-mono mb-6 px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg break-all text-left">
                {this.state.error.message}
              </p>
            )}
            <button onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors">
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
