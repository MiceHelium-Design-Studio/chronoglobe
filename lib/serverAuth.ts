import { NextRequest } from 'next/server';
import { getFirebaseAdminAuth } from './firebaseAdmin';

export class ApiAuthError extends Error {
  readonly statusCode: number;

  constructor(message = 'Authentication required.', statusCode = 401) {
    super(message);
    this.name = 'ApiAuthError';
    this.statusCode = statusCode;
  }
}

export interface AuthenticatedRequestUser {
  uid: string;
  email: string | null;
}

function getBearerToken(request: NextRequest): string {
  const header = request.headers.get('authorization');

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiAuthError();
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new ApiAuthError();
  }

  return token;
}

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedRequestUser> {
  const token = getBearerToken(request);

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    throw new ApiAuthError('Invalid authentication token.', 401);
  }
}
