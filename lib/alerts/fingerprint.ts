import { createHash } from 'node:crypto';

export interface FingerprintableArticle {
  url: string | null;
  title: string;
  source: string;
  publishedAt: string;
}

const TRACKING_QUERY_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'mc_cid',
  'mc_eid',
]);

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function normalizeArticleUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';

  const keysToDelete: string[] = [];
  parsed.searchParams.forEach((_, key) => {
    if (TRACKING_QUERY_KEYS.has(key.toLowerCase())) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => parsed.searchParams.delete(key));

  return parsed.toString();
}

export function toArticleFingerprint(article: FingerprintableArticle): string {
  const normalizedUrl = (() => {
    if (!article.url) {
      return null;
    }

    try {
      return normalizeArticleUrl(article.url);
    } catch {
      return normalizeWhitespace(article.url);
    }
  })();

  if (normalizedUrl) {
    return sha256(`url:${normalizedUrl.toLowerCase()}`);
  }

  return sha256(
    [
      'fallback',
      normalizeWhitespace(article.title).toLowerCase(),
      normalizeWhitespace(article.source).toLowerCase(),
      normalizeWhitespace(article.publishedAt),
    ].join('|'),
  );
}

export function toTriggerEventId(input: {
  uid: string;
  alertId: string;
  articleFingerprint: string;
}): string {
  return sha256(`${input.uid}|${input.alertId}|${input.articleFingerprint}`);
}
