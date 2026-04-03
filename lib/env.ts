const generalAppKeys = ['NEXT_PUBLIC_APP_URL'] as const;

const billingKeys = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_TEAM_MONTHLY',
] as const;

const alertsKeys = ['ALERT_EVALUATOR_SECRET', 'NEWS_API_KEY'] as const;

const newsApiKeys = ['NEWS_API_KEY'] as const;

const firebaseAdminKeys = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
] as const;

const clientKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

type ClientKey = (typeof clientKeys)[number];
type EnvValues<K extends readonly string[]> = Record<K[number], string>;

export type GeneralAppEnv = EnvValues<typeof generalAppKeys>;
export type BillingEnv = EnvValues<typeof billingKeys>;
export type AlertsEnv = EnvValues<typeof alertsKeys>;
export type NewsApiEnv = EnvValues<typeof newsApiKeys>;
export type FirebaseAdminEnv = EnvValues<typeof firebaseAdminKeys>;

function missingKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

function formatEnvError(scope: string, missing: string[]) {
  return new Error(
    [
      `Missing required ${scope} environment variables:`,
      ...missing.map((key) => `- ${key}`),
      '',
      'Create or update `.env.local` with these keys before running the app.',
    ].join('\n'),
  );
}

function readEnv<K extends readonly string[]>(
  scope: string,
  keys: K,
): EnvValues<K> {
  const missing = missingKeys(keys);
  if (missing.length > 0) {
    throw formatEnvError(scope, missing);
  }

  const values = {} as EnvValues<K>;
  for (const key of keys as readonly K[number][]) {
    values[key] = process.env[key]!;
  }

  return values;
}

let generalAppCache: GeneralAppEnv | null = null;

export function getGeneralAppEnv(): GeneralAppEnv {
  if (generalAppCache) {
    return generalAppCache;
  }

  generalAppCache = readEnv('general app', generalAppKeys);
  return generalAppCache;
}

export function validateGeneralAppEnv(): void {
  void getGeneralAppEnv();
}

let billingCache: BillingEnv | null = null;

export function getBillingEnv(): BillingEnv {
  if (billingCache) {
    return billingCache;
  }

  billingCache = readEnv('billing', billingKeys);
  return billingCache;
}

export function validateBillingEnv(): void {
  void getBillingEnv();
}

let alertsCache: AlertsEnv | null = null;

export function getAlertsEnv(): AlertsEnv {
  if (alertsCache) {
    return alertsCache;
  }

  alertsCache = readEnv('alerts', alertsKeys);
  return alertsCache;
}

export function validateAlertsEnv(): void {
  void getAlertsEnv();
}

let newsApiCache: NewsApiEnv | null = null;

export function getNewsApiEnv(): NewsApiEnv {
  if (newsApiCache) {
    return newsApiCache;
  }

  newsApiCache = readEnv('news api', newsApiKeys);
  return newsApiCache;
}

export function validateNewsApiEnv(): void {
  void getNewsApiEnv();
}

let firebaseAdminCache: FirebaseAdminEnv | null = null;

export function getFirebaseAdminEnv(): FirebaseAdminEnv {
  if (firebaseAdminCache) {
    return firebaseAdminCache;
  }

  firebaseAdminCache = readEnv('firebase admin', firebaseAdminKeys);
  return firebaseAdminCache;
}

export function validateFirebaseAdminEnv(): void {
  void getFirebaseAdminEnv();
}

let clientCache: Record<ClientKey, string> | null = null;

export function getClientEnv(): Record<ClientKey, string> {
  if (clientCache) {
    return clientCache;
  }

  const missing = missingKeys(clientKeys);
  if (missing.length > 0) {
    throw formatEnvError('client', missing);
  }

  clientCache = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  return clientCache;
}
