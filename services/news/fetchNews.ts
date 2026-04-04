import { ValidatedNewsQuery, toNewsApiSearchQuery } from '../../lib/newsQuery';
import { UpstreamNewsArticle } from '../../types/news';

const NEWS_API_EVERYTHING_URL = 'https://newsapi.org/v2/everything';

interface NewsApiSuccessResponse {
  status: 'ok';
  articles?: UpstreamNewsArticle[];
}

interface NewsApiErrorResponse {
  status: 'error';
  code?: string;
  message?: string;
}

type NewsApiResponse = NewsApiSuccessResponse | NewsApiErrorResponse;

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
        ? (value.articles as UpstreamNewsArticle[])
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

export interface FetchNewsResult {
  statusCode: number;
  articles: UpstreamNewsArticle[];
  upstreamCode?: string;
}

export async function fetchNews(query: ValidatedNewsQuery, apiKey: string): Promise<FetchNewsResult> {
  const url = new URL(NEWS_API_EVERYTHING_URL);
  url.searchParams.set('q', toNewsApiSearchQuery(query));
  url.searchParams.set('language', query.language);
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '30');

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
      'X-Api-Key': apiKey,
    },
  });

  const json = (await response.json().catch(() => null)) as unknown;
  const payload = toNewsApiResponse(json);

  if (!payload) {
    throw new Error(`News API returned invalid payload (HTTP ${response.status}).`);
  }

  if (!response.ok || payload.status === 'error') {
    return {
      statusCode: response.status,
      articles: [],
      upstreamCode: payload.status === 'error' ? payload.code : undefined,
    };
  }

  return {
    statusCode: response.status,
    articles: payload.articles ?? [],
  };
}
