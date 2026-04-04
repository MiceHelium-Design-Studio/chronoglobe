'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GoogleAuthProvider, User, signInWithPopup } from 'firebase/auth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { reportAuthError } from '../../lib/errorTracking';
import { auth, getFirebaseInitializationError } from '../../lib/firebase';

export interface GoogleSignInSuccess {
  user: User;
  idToken: string;
}

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  redirectTo?: string;
  onSuccess?: (result: GoogleSignInSuccess) => void | Promise<void>;
}

const baseButtonClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60';

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Google sign-in failed. Please try again.';
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.6 2.8 11.8s4.1 9.4 9.2 9.4c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path fill="#34A853" d="M2.8 7.1l3.2 2.3c.9-1.8 2.7-3.1 5-3.1 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.7 2.4 12 2.4c-3.6 0-6.7 2.1-8.2 5.2z" />
      <path fill="#4A90E2" d="M12 21.2c2.4 0 4.5-.8 6-2.3l-2.8-2.2c-.8.6-1.9 1-3.2 1-2.5 0-4.6-1.7-5.3-4.1L3.5 16c1.5 3.1 4.7 5.2 8.5 5.2z" />
      <path fill="#FBBC05" d="M6.7 13.6c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3.5 7.1c-.6 1.3-.9 2.8-.9 4.4s.3 3.1.9 4.4l3.2-2.3z" />
    </svg>
  );
}

export function GoogleSignInButton({
  label = 'Continue with Google',
  className,
  redirectTo = '/dashboard',
  onSuccess,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { track } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    setLoading(true);
    setError(null);

    if (!auth) {
      const initializationError = getFirebaseInitializationError();
      setError(initializationError?.message ?? 'Authentication is unavailable right now.');
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();

      track('login', {
        method: 'google',
        uid: credential.user.uid,
      });

      if (onSuccess) {
        await onSuccess({
          user: credential.user,
          idToken,
        });
      } else {
        router.push(redirectTo);
      }
    } catch (signInError) {
      reportAuthError(signInError, {
        operation: 'login',
        route: 'google_popup',
        userId: auth.currentUser?.uid ?? null,
      });
      setError(toMessage(signInError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          void handleGoogleSignIn();
        }}
        disabled={loading}
        className={className ?? baseButtonClassName}
      >
        <GoogleIcon />
        {loading ? 'Connecting...' : label}
      </button>
      {error && (
        <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      )}
    </div>
  );
}
