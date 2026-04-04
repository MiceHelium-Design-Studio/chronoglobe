import { NextRequest, NextResponse } from 'next/server';
import { getEraByYear, getTimelineEras } from '../../../services/history/getTimelineEras';

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get('year');
  const eras = getTimelineEras();

  if (!yearParam) {
    return NextResponse.json({ eras });
  }

  const year = Number(yearParam);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: '`year` must be numeric.' }, { status: 400 });
  }

  const era = getEraByYear(year);
  if (!era) {
    return NextResponse.json({ error: 'Era not found.' }, { status: 404 });
  }

  return NextResponse.json({ era });
}
