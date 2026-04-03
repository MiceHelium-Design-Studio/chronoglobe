import { NextRequest, NextResponse } from 'next/server';
import { validateFirebaseAdminEnv } from '../../../../lib/env';
import { captureExceptionWithContext } from '../../../../lib/sentryContext';
import { serverLogger } from '../../../../lib/serverLogger';
import { ApiAuthError, requireAuthenticatedUser } from '../../../../lib/serverAuth';
import { BillingStatusResponse } from '../../../../types/billing';
import { getUserBillingByUid } from '../../../../lib/billing/billingState';

validateFirebaseAdminEnv();

const ROUTE = '/api/billing/status';
export const runtime = 'nodejs';

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser(request);
    const billing = await getUserBillingByUid(user.uid);
    const response: BillingStatusResponse = { billing };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      serverLogger.warn('Billing status authentication failed', {
        route: ROUTE,
        requestId,
        statusCode: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        {
          status: error.statusCode,
          headers: {
            'X-Request-Id': requestId,
          },
        },
      );
    }

    captureExceptionWithContext(error, {
      featureArea: 'api',
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    serverLogger.error('Billing status request failed', error, {
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Unable to read billing status right now.' },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
