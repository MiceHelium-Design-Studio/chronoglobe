import { NextRequest, NextResponse } from 'next/server';
import { getNewsApiEnv, validateNewsApiEnv } from '../../../lib/env';
import { ingestNewsArticles } from '../../../lib/ingestion/news';
import { takeRateLimitToken } from '../../../lib/rateLimit';
import { serverLogger } from '../../../lib/serverLogger';
import { captureExceptionWithContext } from '../../../lib/sentryContext';
import { ValidatedNewsQuery, validateNewsQuery } from '../../../lib/newsQuery';
import { NewsFilters } from '../../../types/news';
import { fetchNews } from '../../../services/news/fetchNews';

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
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

async function fetchNewsFromUpstream(query: ValidatedNewsQuery): Promise<{
  articles: ReturnType<typeof ingestNewsArticles>['articles'];
  statusCode: number;
  upstreamCode?: string;
}> {
  validateNewsApiEnv();
  const env = getNewsApiEnv();
  const upstream = await fetchNews(query, env.NEWS_API_KEY);

  if (upstream.statusCode >= 400) {
    return {
      articles: [],
      statusCode: upstream.statusCode,
      upstreamCode: upstream.upstreamCode,
    };
  }

  const ingestion = ingestNewsArticles(upstream.articles);

  return {
    articles: ingestion.articles,
    statusCode: upstream.statusCode,
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
