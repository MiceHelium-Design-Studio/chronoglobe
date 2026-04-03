'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AuthSync } from '../components/auth/AuthSync';
import { UserDataSync } from '../components/sync/UserDataSync';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <AuthSync />
      <UserDataSync />
      {children}
    </Provider>
  );
}
