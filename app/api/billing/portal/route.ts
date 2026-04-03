import { NextRequest, NextResponse } from 'next/server';
import {
  validateBillingEnv,
  validateFirebaseAdminEnv,
  validateGeneralAppEnv,
} from '../../../../lib/env';
import { captureExceptionWithContext } from '../../../../lib/sentryContext';
import { serverLogger } from '../../../../lib/serverLogger';
import { ApiAuthError, requireAuthenticatedUser } from '../../../../lib/serverAuth';
import { createBillingPortalSession } from '../../../../lib/billing/stripeBillingService';
import { BillingPortalResponse } from '../../../../types/billing';

validateBillingEnv();
validateGeneralAppEnv();
validateFirebaseAdminEnv();

const ROUTE = '/api/billing/portal';
export const runtime = 'nodejs';

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser(request);
    const session = await createBillingPortalSession({
      uid: user.uid,
      email: user.email,
    });

    const response: BillingPortalResponse = {
      url: session.url,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      serverLogger.warn('Billing portal authentication failed', {
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

    serverLogger.error('Billing portal session failed', error, {
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Unable to open billing portal right now.' },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
