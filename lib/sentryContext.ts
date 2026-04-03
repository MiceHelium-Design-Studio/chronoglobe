import * as Sentry from '@sentry/nextjs';

export type FeatureArea =
  | 'api'
  | 'auth'
  | 'ui'
  | 'news'
  | 'analytics'
  | 'sync'
  | 'unknown';

export interface SafeSentryContext {
  featureArea: FeatureArea;
  route?: string;
  userId?: string | null;
  requestId?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN = /password|pass|secret|token|authorization|cookie|dsn|api[_-]?key/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) {
    return '[truncated]';
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    Object.entries(input).forEach(([key, entry]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return;
      }

      output[key] = sanitizeValue(entry, depth + 1);
    });

    return output;
  }

  return String(value);
}

export function captureExceptionWithContext(
  error: unknown,
  context: SafeSentryContext,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('feature_area', context.featureArea);

    if (context.route) {
      scope.setTag('route', context.route);
    }

    if (context.requestId) {
      scope.setTag('request_id', context.requestId);
    }

    if (typeof context.statusCode === 'number') {
      scope.setTag('status_code', String(context.statusCode));
    }

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context.metadata) {
      scope.setContext(
        'safe_metadata',
        sanitizeValue(context.metadata) as Record<string, unknown>,
      );
    }

    Sentry.captureException(error);
  });
}
