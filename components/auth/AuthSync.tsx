'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppDispatch } from '../../store/store';
import { setUser } from '../../store/slices/authSlice';
import { reportAuthError } from '../../lib/errorTracking';

export function AuthSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
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
  }, [dispatch]);

  return null;
}
