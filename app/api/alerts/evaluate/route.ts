import { NextRequest, NextResponse } from 'next/server';
import { evaluateActiveAlerts } from '../../../../lib/alerts/evaluator';
import { getAlertsEnv, validateFirebaseAdminEnv } from '../../../../lib/env';
import { captureExceptionWithContext } from '../../../../lib/sentryContext';
import { serverLogger } from '../../../../lib/serverLogger';

export const runtime = 'nodejs';

const ROUTE = '/api/alerts/evaluate';

interface AlertEvaluatorResponse {
  ok: true;
  requestId: string;
  metrics: Awaited<ReturnType<typeof evaluateActiveAlerts>>;
}

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

function getInternalSecret(request: NextRequest): string | null {
  const direct = request.headers.get('x-alert-evaluator-key');
  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function shouldForceDebugCandidates(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const debugQuery = request.nextUrl.searchParams.get('__debugCandidates');
  if (debugQuery === '1' || debugQuery === 'true') {
    return true;
  }

  const debugHeader = request.headers.get('x-alert-evaluator-debug');
  return debugHeader === '1' || debugHeader === 'true';
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const debugForceCandidates = shouldForceDebugCandidates(request);
  let alertsEnv: ReturnType<typeof getAlertsEnv>;

  try {
    alertsEnv = getAlertsEnv();
    validateFirebaseAdminEnv();
  } catch (error) {
    serverLogger.error('Alert evaluator environment validation failed', error, {
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    return NextResponse.json(
      {
        error: 'Server configuration error.',
        requestId,
        ...(process.env.NODE_ENV !== 'production' && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }

  const providedSecret = getInternalSecret(request);

  if (!providedSecret || providedSecret !== alertsEnv.ALERT_EVALUATOR_SECRET) {
    serverLogger.warn('Blocked unauthorized alert evaluator call', {
      route: ROUTE,
      requestId,
      statusCode: 401,
    });

    return NextResponse.json(
      { error: 'Unauthorized.', requestId },
      {
        status: 401,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }

  try {
    const startedAtMs = Date.now();
    const summary = await evaluateActiveAlerts({
      newsApiKey: alertsEnv.NEWS_API_KEY,
      debugForceCandidates,
    });
    const durationMs = Date.now() - startedAtMs;

    serverLogger.info('Alert evaluator completed', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      durationMs,
      debugForceCandidates,
      metrics: summary,
    });

    const payload: AlertEvaluatorResponse = {
      ok: true,
      requestId,
      metrics: summary,
    };

    return NextResponse.json(
      payload,
      {
        status: 200,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  } catch (error) {
    captureExceptionWithContext(error, {
      featureArea: 'api',
      route: ROUTE,
      requestId,
      statusCode: 500,
    });
    serverLogger.error('Alert evaluator failed', error, {
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Alert evaluation failed.', requestId },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
