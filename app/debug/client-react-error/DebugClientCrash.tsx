'use client';

import { reportClientError } from '../../../lib/errorTracking';

export default function DebugClientCrash(): never {
  const error = new Error('Forced client-side React render error for Sentry verification.');

  reportClientError(error, {
    route: '/debug/client-react-error',
    feature: 'debug-verification',
  });

  throw error;
}
