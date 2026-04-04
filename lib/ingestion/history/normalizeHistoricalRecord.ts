import { Era } from '../../../types/history';
import { validateEra } from './validateEra';

export function normalizeHistoricalRecord(input: Era): Era {
  const normalized: Era = {
    ...input,
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || undefined,
    description: input.description.trim(),
    eraLabel: input.eraLabel.trim(),
    tags: input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    hotspots: input.hotspots.map((spot) => spot.trim()).filter(Boolean),
    summary: {
      ...input.summary,
      dominantPowers: input.summary.dominantPowers.map((item) => item.trim()).filter(Boolean),
      conflicts: input.summary.conflicts.map((item) => item.trim()).filter(Boolean),
      population: input.summary.population?.trim() || undefined,
      technologyLevel: input.summary.technologyLevel?.trim() || undefined,
      tradeContext: input.summary.tradeContext?.trim() || undefined,
      culturalShift: input.summary.culturalShift?.trim() || undefined,
    },
    map: {
      ...input.map,
      theme: input.map.theme.trim().toLowerCase(),
      imageUrl: input.map.imageUrl?.trim() || undefined,
      markers: input.map.markers.map((marker) => ({
        ...marker,
        label: marker.label.trim(),
        note: marker.note?.trim() || undefined,
      })),
      regions: input.map.regions.map((region) => ({
        ...region,
        label: region.label.trim(),
      })),
    },
    events: input.events.map((event) => ({
      ...event,
      title: event.title.trim(),
      summary: event.summary.trim(),
      region: event.region.trim(),
      tags: event.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    })),
  };

  return validateEra(normalized);
}
