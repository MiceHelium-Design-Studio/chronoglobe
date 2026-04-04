import { eraSeedRecords } from '../../../data/timeline/seedEras';
import { seedEventsByYear } from '../../../data/timeline/seedEvents';
import { seedRegionsByYear } from '../../../data/timeline/seedRegions';
import { Era } from '../../../types/history';
import { normalizeHistoricalRecord } from './normalizeHistoricalRecord';

export function seedEras(): Era[] {
  return eraSeedRecords
    .map((record) => {
      const events = seedEventsByYear[record.year] ?? [];
      const regions = seedRegionsByYear[record.year] ?? [];

      return normalizeHistoricalRecord({
        ...record,
        map: {
          ...record.map,
          regions,
        },
        events,
      });
    })
    .sort((a, b) => a.year - b.year);
}
