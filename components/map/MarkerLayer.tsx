'use client';

import { latLngToPercent } from './mapProjection';

export interface MapOverlayMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  intensity: 'high' | 'medium' | 'low';
  note?: string;
}

interface MarkerLayerProps {
  markers: MapOverlayMarker[];
  onSelect?: (marker: MapOverlayMarker) => void;
}

function markerTone(intensity: MapOverlayMarker['intensity']): string {
  if (intensity === 'high') {
    return 'bg-amber-300 shadow-[0_0_22px_2px_rgba(251,191,36,0.55)]';
  }

  if (intensity === 'medium') {
    return 'bg-cyan-300 shadow-[0_0_18px_1px_rgba(34,211,238,0.45)]';
  }

  return 'bg-slate-300 shadow-[0_0_14px_1px_rgba(226,232,240,0.35)]';
}

export function MarkerLayer({ markers, onSelect }: MarkerLayerProps) {
  return (
    <>
      {markers.map((marker) => {
        const { x, y } = latLngToPercent(marker.lat, marker.lng);

        return (
          <button
            key={marker.id}
            type="button"
            onClick={() => onSelect?.(marker)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`${marker.label}${marker.note ? `: ${marker.note}` : ''}`}
          >
            <span className={`block h-3.5 w-3.5 rounded-full ${markerTone(marker.intensity)}`} />
            <span className="pointer-events-none mt-2 inline-block rounded-md border border-white/15 bg-slate-950/85 px-2 py-1 text-[11px] text-slate-200 opacity-0 transition group-hover:opacity-100">
              {marker.label}
            </span>
          </button>
        );
      })}
    </>
  );
}
