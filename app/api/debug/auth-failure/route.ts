import { NextResponse } from 'next/server';
import { reportAuthError } from '../../../../lib/errorTracking';
import { serverLogger } from '../../../../lib/serverLogger';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const requestId = crypto.randomUUID();
  const error = new Error('Forced auth failure for Sentry verification.');

  reportAuthError(error, {
    operation: 'login',
    route: '/login',
    userId: null,
    requestId,
  });

  serverLogger.error('Forced auth failure triggered', error, {
    route: '/api/debug/auth-failure',
    requestId,
    statusCode: 500,
  });

  return NextResponse.json(
    { error: 'Forced auth failure event emitted for verification.' },
    {
      status: 500,
      headers: {
        'X-Request-Id': requestId,
      },
    },
  );
}
