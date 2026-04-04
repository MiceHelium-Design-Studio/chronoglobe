import { seedEras } from '../../lib/ingestion/history';
import { Era } from '../../types/history';

export function getTimelineEras(): Era[] {
  return seedEras();
}

export function getEraByYear(year: number): Era | null {
  return getTimelineEras().find((era) => era.year === year) ?? null;
}
