"use client";

import { Component, type ReactNode } from "react";
import { IncidentScreen } from "@/components/incident-screen";

type Props = { children: ReactNode };
type State = { failed: boolean; retry: number };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, retry: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <IncidentScreen
          onRetry={() =>
            this.setState((current) => ({
              failed: false,
              retry: current.retry + 1,
            }))
          }
        />
      );
    }
    return <div key={this.state.retry}>{this.props.children}</div>;
  }
}
