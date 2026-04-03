'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AuthSync } from '../components/auth/AuthSync';
import { UserDataSync } from '../components/sync/UserDataSync';
import { SyncErrorBoundary } from '../components/sync/SyncErrorBoundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <SyncErrorBoundary name="AuthSync">
        <AuthSync />
      </SyncErrorBoundary>
      <SyncErrorBoundary name="UserDataSync">
        <UserDataSync />
      </SyncErrorBoundary>
      {children}
    </Provider>
  );
}
