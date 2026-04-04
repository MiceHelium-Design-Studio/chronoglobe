'use client';

import { latLngToPercent, radiusKmToPercent } from './mapProjection';

export interface MapOverlayRegion {
  id: string;
  label: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  importance: 'high' | 'medium' | 'low';
}

interface RegionOverlayLayerProps {
  regions: MapOverlayRegion[];
}

function importanceTone(importance: MapOverlayRegion['importance']): string {
  if (importance === 'high') {
    return 'border-cyan-300/45 bg-cyan-400/10';
  }

  if (importance === 'medium') {
    return 'border-blue-300/35 bg-blue-400/10';
  }

  return 'border-slate-400/30 bg-slate-400/10';
}

export function RegionOverlayLayer({ regions }: RegionOverlayLayerProps) {
  return (
    <>
      {regions.map((region) => {
        const { x, y } = latLngToPercent(region.centerLat, region.centerLng);
        const size = radiusKmToPercent(region.radiusKm);

        return (
          <div
            key={region.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${importanceTone(region.importance)}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}%`,
              height: `${size}%`,
            }}
            aria-label={region.label}
            title={region.label}
          />
        );
      })}
    </>
  );
}
