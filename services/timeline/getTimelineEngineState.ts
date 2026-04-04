import { Era, TimelineEngineState } from '../../types/history';
import { IntelligenceMode } from '../../types/intelligence';
import { getTimelineEras } from '../history/getTimelineEras';

export function resolveTimelineEra(year?: number): Era {
  const eras = getTimelineEras();
  const fallback = eras[eras.length - 1];

  if (!Number.isFinite(year)) {
    return fallback;
  }

  return eras.find((era) => era.year === year) ?? fallback;
}

export function getTimelineEngineState(
  mode: IntelligenceMode,
  year?: number,
): TimelineEngineState {
  const selectedEra = resolveTimelineEra(year);

  return {
    mode,
    selectedYear: selectedEra.year,
    selectedEra,
  };
}
