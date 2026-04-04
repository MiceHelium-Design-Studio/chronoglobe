import { Era } from '../../../types/history';

function hasString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateEra(era: Era): Era {
  if (!Number.isFinite(era.year)) {
    throw new Error('Era year must be a finite number.');
  }

  if (!hasString(era.slug) || !hasString(era.title) || !hasString(era.description)) {
    throw new Error('Era slug, title, and description are required.');
  }

  if (!hasString(era.eraLabel)) {
    throw new Error('Era label is required.');
  }

  if (!Array.isArray(era.events) || era.events.length === 0) {
    throw new Error(`Era ${era.slug} requires at least one event.`);
  }

  if (!Array.isArray(era.map.markers)) {
    throw new Error(`Era ${era.slug} has invalid map markers.`);
  }

  return era;
}
