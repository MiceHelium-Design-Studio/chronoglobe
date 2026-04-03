import { captureExceptionWithContext } from './sentryContext';

export interface AuthErrorContext {
  operation: 'login' | 'signup' | 'logout' | 'auth_state';
  route?: string;
  userId?: string | null;
  requestId?: string;
}

export function reportAuthError(
  error: unknown,
  context: AuthErrorContext,
): void {
  captureExceptionWithContext(error, {
    featureArea: 'auth',
    route: context.route,
    userId: context.userId,
    requestId: context.requestId,
    metadata: {
      operation: context.operation,
    },
  });
}

export function reportClientError(
  error: unknown,
  context: Record<string, unknown>,
): void {
  captureExceptionWithContext(error, {
    featureArea: 'ui',
    metadata: context,
  });
}
