'use client';

import { Component, ReactNode } from 'react';
import { reportClientError } from '../../lib/errorTracking';

interface SyncErrorBoundaryProps {
  name: string;
  children: ReactNode;
}

interface SyncErrorBoundaryState {
  hasError: boolean;
}

export class SyncErrorBoundary extends Component<
  SyncErrorBoundaryProps,
  SyncErrorBoundaryState
> {
  state: SyncErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SyncErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    reportClientError(error, {
      area: 'sync_boundary',
      component: this.props.name,
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
