'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getFirebaseInitializationError } from '../../lib/firebase';
import { useAppDispatch } from '../../store/store';
import { setUser } from '../../store/slices/authSlice';
import { reportAuthError } from '../../lib/errorTracking';

export function AuthSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!auth) {
      const initializationError = getFirebaseInitializationError();
      if (initializationError) {
        reportAuthError(initializationError, {
          operation: 'auth_state',
          route: 'auth-listener',
        });
      }
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          dispatch(setUser(user));
        },
        (error) => {
          reportAuthError(error, { operation: 'auth_state', route: 'auth-listener' });
        },
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      reportAuthError(error, { operation: 'auth_state', route: 'auth-listener' });
    }
  }, [dispatch]);

  return null;
}
