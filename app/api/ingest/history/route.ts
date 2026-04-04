import { NextRequest, NextResponse } from 'next/server';
import { seedEras } from '../../../../lib/ingestion/history';
import { serverLogger } from '../../../../lib/serverLogger';

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.INGEST_API_KEY;
  if (!configured) {
    return process.env.NODE_ENV !== 'production';
  }

  const provided = request.headers.get('x-ingest-key');
  return provided === configured;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized ingestion request.' }, { status: 401 });
  }

  const eras = seedEras();

  serverLogger.info('History ingestion scaffold executed', {
    route: '/api/ingest/history',
    eraCount: eras.length,
  });

  return NextResponse.json({
    ok: true,
    ingested: eras.length,
    years: eras.map((era) => era.year),
    note: 'Scaffold run complete. Persistence target can be wired to Firestore/CMS.',
  });
}
