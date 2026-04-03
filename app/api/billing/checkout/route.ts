import { NextRequest, NextResponse } from 'next/server';
import { captureExceptionWithContext } from '../../../../lib/sentryContext';
import {
  validateBillingEnv,
  validateFirebaseAdminEnv,
  validateGeneralAppEnv,
} from '../../../../lib/env';
import { serverLogger } from '../../../../lib/serverLogger';
import { ApiAuthError, requireAuthenticatedUser } from '../../../../lib/serverAuth';
import { createCheckoutSession } from '../../../../lib/billing/stripeBillingService';
import { BillingCheckoutRequest, BillingCheckoutResponse, PaidPlan } from '../../../../types/billing';

validateBillingEnv();
validateGeneralAppEnv();
validateFirebaseAdminEnv();

const ROUTE = '/api/billing/checkout';
export const runtime = 'nodejs';

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'team';
}

async function readRequestBody(request: NextRequest): Promise<BillingCheckoutRequest> {
  const payload = (await request.json().catch(() => null)) as
    | Partial<BillingCheckoutRequest>
    | null;

  if (!payload || !isPaidPlan(payload.plan)) {
    throw new Error('Invalid request payload. Expected plan to be pro or team.');
  }

  return {
    plan: payload.plan,
  };
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await readRequestBody(request);
    const session = await createCheckoutSession({
      uid: user.uid,
      email: user.email,
      plan: body.plan,
    });

    if (!session.url) {
      throw new Error('Stripe checkout session was created without a redirect URL.');
    }

    const response: BillingCheckoutResponse = {
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
      serverLogger.warn('Billing checkout authentication failed', {
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

    const statusCode =
      error instanceof Error && error.message.includes('Invalid request payload')
        ? 400
        : 500;

    captureExceptionWithContext(error, {
      featureArea: 'api',
      route: ROUTE,
      requestId,
      statusCode,
    });

    serverLogger.error('Billing checkout session failed', error, {
      route: ROUTE,
      requestId,
      statusCode,
    });

    return NextResponse.json(
      {
        error:
          statusCode === 400
            ? 'Invalid billing checkout request.'
            : 'Unable to start checkout right now.',
      },
      {
        status: statusCode,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
