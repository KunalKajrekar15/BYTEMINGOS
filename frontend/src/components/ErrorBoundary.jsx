import { Component } from "react";

// The assignment requires a class component. This one handles render failures.
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Bytemingos interface error:", error);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="empty">
          <h1>Let’s start fresh.</h1>
          <p>The page could not load. Your saved bag will still be here.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      );
    return this.props.children;
  }
}
