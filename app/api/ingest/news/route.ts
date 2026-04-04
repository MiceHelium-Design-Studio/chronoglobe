import { NextRequest, NextResponse } from 'next/server';
import { getNewsApiEnv } from '../../../../lib/env';
import { ingestNewsArticles } from '../../../../lib/ingestion/news';
import { validateNewsQuery } from '../../../../lib/newsQuery';
import { fetchNews } from '../../../../services/news/fetchNews';
import { NewsFilters } from '../../../../types/news';

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.INGEST_API_KEY;
  if (!configured) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('x-ingest-key') === configured;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized ingestion request.' }, { status: 401 });
  }

  const filters = (await request.json().catch(() => ({}))) as NewsFilters;

  let query;
  try {
    query = validateNewsQuery(filters);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query.' },
      { status: 400 },
    );
  }

  const env = getNewsApiEnv();
  const upstream = await fetchNews(query, env.NEWS_API_KEY);

  if (upstream.statusCode >= 400) {
    return NextResponse.json(
      {
        error: 'Upstream news provider failed.',
        statusCode: upstream.statusCode,
        upstreamCode: upstream.upstreamCode,
      },
      { status: 502 },
    );
  }

  const ingestion = ingestNewsArticles(upstream.articles);

  return NextResponse.json({
    ok: true,
    metrics: {
      inputCount: ingestion.inputCount,
      normalizedCount: ingestion.normalizedCount,
      dedupedCount: ingestion.dedupedCount,
    },
    sample: ingestion.articles.slice(0, 5),
    note: 'Scaffold run complete. Persist cache layer can be added next.',
  });
}
