'use client';

import { useEffect } from 'react';
import { captureExceptionWithContext } from '../lib/sentryContext';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    captureExceptionWithContext(error, {
      featureArea: 'ui',
      route: 'app/global-error',
      metadata: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h1 className="text-2xl font-semibold">App error detected</h1>
          <p className="mt-2 text-sm text-slate-300">
            The issue has been reported automatically.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-300"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
