function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function latLngToPercent(lat: number, lng: number): { x: number; y: number } {
  const x = clamp(((lng + 180) / 360) * 100, 2, 98);
  const y = clamp(((90 - lat) / 180) * 100, 4, 96);
  return { x, y };
}

export function radiusKmToPercent(radiusKm: number): number {
  return clamp(radiusKm / 85, 6, 26);
}
