import { NextRequest, NextResponse } from 'next/server';
import { getNewsApiEnv, validateNewsApiEnv } from '../../../lib/env';
import { takeRateLimitToken } from '../../../lib/rateLimit';
import { serverLogger } from '../../../lib/serverLogger';
import { captureExceptionWithContext } from '../../../lib/sentryContext';
import {
  toNewsApiSearchQuery,
  ValidatedNewsQuery,
  validateNewsQuery,
} from '../../../lib/newsQuery';
import { NewsArticle, NewsFilters } from '../../../types/news';

validateNewsApiEnv();
const newsApiEnv = getNewsApiEnv();

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const NEWS_API_EVERYTHING_URL = 'https://newsapi.org/v2/everything';

interface NewsApiSource {
  id?: string | null;
  name?: string | null;
}

interface NewsApiArticle {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  source?: NewsApiSource | null;
  author?: string | null;
  content?: string | null;
}

interface NewsApiSuccessResponse {
  status: 'ok';
  articles?: NewsApiArticle[];
}

interface NewsApiErrorResponse {
  status: 'error';
  code?: string;
  message?: string;
}

type NewsApiResponse = NewsApiSuccessResponse | NewsApiErrorResponse;

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown-client';
  }

  return 'unknown-client';
}

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNewsApiResponse(value: unknown): NewsApiResponse | null {
  if (!isObject(value) || typeof value.status !== 'string') {
    return null;
  }

  if (value.status === 'ok') {
    return {
      status: 'ok',
      articles: Array.isArray(value.articles)
        ? (value.articles as NewsApiArticle[])
        : [],
    };
  }

  if (value.status === 'error') {
    return {
      status: 'error',
      code: typeof value.code === 'string' ? value.code : undefined,
      message: typeof value.message === 'string' ? value.message : undefined,
    };
  }

  return null;
}

function toStringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNewsArticle(article: NewsApiArticle): NewsArticle | null {
  const title = toStringValue(article.title);
  const url = toStringValue(article.url);
  const publishedAt = toStringValue(article.publishedAt);
  const sourceName = toStringValue(article.source?.name);

  if (!title || !url || !publishedAt || !sourceName) {
    return null;
  }

  return {
    title,
    description: article.description ?? null,
    url,
    urlToImage: article.urlToImage ?? null,
    publishedAt,
    source: {
      id: article.source?.id ?? null,
      name: sourceName,
    },
    author: article.author ?? null,
    content: article.content ?? null,
  };
}

async function fetchNewsFromUpstream(query: ValidatedNewsQuery): Promise<{
  articles: NewsArticle[];
  statusCode: number;
  upstreamCode?: string;
}> {
  const url = new URL(NEWS_API_EVERYTHING_URL);
  url.searchParams.set('q', toNewsApiSearchQuery(query));
  url.searchParams.set('language', query.language);
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '20');

  if (query.from) {
    url.searchParams.set('from', query.from);
  }

  if (query.to) {
    url.searchParams.set('to', query.to);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': newsApiEnv.NEWS_API_KEY,
    },
  });

  const json = (await response.json().catch(() => null)) as unknown;
  const payload = toNewsApiResponse(json);

  if (!payload) {
    throw new Error(`News API returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok || payload.status === 'error') {
    return {
      articles: [],
      statusCode: response.status,
      upstreamCode: payload.status === 'error' ? payload.code : undefined,
    };
  }

  const articles = payload.articles
    ?.map((article) => toNewsArticle(article))
    .filter((article): article is NewsArticle => article !== null) ?? [];

  return {
    articles,
    statusCode: response.status,
  };
}

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  const requestId = getRequestId(request);
  const limit = takeRateLimitToken(clientKey, RATE_LIMIT, RATE_WINDOW_MS);

  if (!limit.allowed) {
    serverLogger.warn('News API rate limit exceeded', {
      route: '/api/news',
      requestId,
      statusCode: 429,
      clientKey,
      remaining: limit.remaining,
    });

    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait before making another request.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.max(
            Math.ceil((limit.resetAt - Date.now()) / 1000),
            1,
          ).toString(),
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetAt.toString(),
          'X-Request-Id': requestId,
        },
      },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const rawFilters: NewsFilters = {
    q: searchParams.get('q') ?? undefined,
    category: (searchParams.get('category') as NewsFilters['category']) ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    language: searchParams.get('language') ?? undefined,
  };
  const forceUpstreamError =
    process.env.NODE_ENV !== 'production' &&
    searchParams.get('__debug') === 'upstream_error';

  let query: ValidatedNewsQuery;
  let upstreamStatusCode: number | undefined;
  let upstreamCode: string | undefined;
  try {
    query = validateNewsQuery(rawFilters);
  } catch (error) {
    serverLogger.warn('News API query validation failed', {
      route: '/api/news',
      requestId,
      statusCode: 400,
      rawFilters,
      error: error instanceof Error ? error.message : 'unknown-error',
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Invalid request query parameters.',
      },
      {
        status: 400,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }

  try {
    if (forceUpstreamError) {
      throw new Error('Forced /api/news upstream error for verification.');
    }

    const upstreamResult = await fetchNewsFromUpstream(query);
    upstreamStatusCode = upstreamResult.statusCode;
    upstreamCode = upstreamResult.upstreamCode;

    if (upstreamStatusCode >= 400) {
      throw new Error(
        `News API upstream request failed with HTTP ${upstreamStatusCode}${
          upstreamCode ? ` (${upstreamCode})` : ''
        }.`,
      );
    }

    return NextResponse.json(
      { articles: upstreamResult.articles },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetAt.toString(),
          'X-Request-Id': requestId,
        },
      },
    );
  } catch (error) {
    captureExceptionWithContext(error, {
      featureArea: 'api',
      route: '/api/news',
      requestId,
      statusCode: 502,
      metadata: {
        clientKey,
        query,
        forceUpstreamError,
        upstreamStatusCode,
        upstreamCode,
      },
    });
    serverLogger.error('News API upstream request failed', error, {
      route: '/api/news',
      requestId,
      statusCode: 502,
      clientKey,
      query,
      upstreamStatusCode,
      upstreamCode,
    });

    return NextResponse.json(
      { error: 'Failed to fetch news from upstream provider.' },
      {
        status: 502,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
