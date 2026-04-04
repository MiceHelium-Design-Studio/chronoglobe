'use client';

import { Era } from '../../types/history';
import { MapLegend } from '../map/MapLegend';
import { MapShell } from '../map/MapShell';
import { MarkerLayer } from '../map/MarkerLayer';
import { RegionOverlayLayer } from '../map/RegionOverlayLayer';

interface HistoricalMapPanelProps {
  era: Era;
}

export function HistoricalMapPanel({ era }: HistoricalMapPanelProps) {
  return (
    <MapShell
      title={`World State: ${era.map.theme}`}
      subtitle={era.description}
      mode="historical"
      theme={era.map.theme}
    >
      <RegionOverlayLayer regions={era.map.regions} />
      <MarkerLayer markers={era.map.markers} />

      <div className="absolute right-4 top-4">
        <MapLegend
          mode="historical"
          markerCount={era.map.markers.length}
          regionCount={era.map.regions.length}
          label="Map Legend"
        />
      </div>

      <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {era.events.slice(0, 3).map((event) => (
          <article
            key={event.id}
            className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur"
          >
            <p className="text-xs font-semibold text-slate-100">{event.title}</p>
            <p className="text-[11px] text-slate-400">{event.region}</p>
          </article>
        ))}
      </div>
    </MapShell>
  );
}
