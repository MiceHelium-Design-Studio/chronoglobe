'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapLegend } from '../../../components/map/MapLegend';
import { MapOverlayMarker, MarkerLayer } from '../../../components/map/MarkerLayer';
import { MapOverlayRegion, RegionOverlayLayer } from '../../../components/map/RegionOverlayLayer';
import { MapShell } from '../../../components/map/MapShell';
import { useAppSelector } from '../../../store/store';

const DynamicMap = dynamic(() => import('../../../components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-300">
      Loading operational map layer...
    </div>
  ),
});

function classifyIntensity(matchCount: number): MapOverlayMarker['intensity'] {
  if (matchCount >= 4) {
    return 'high';
  }

  if (matchCount >= 2) {
    return 'medium';
  }

  return 'low';
}

export default function MapIntelligencePage() {
  const user = useAppSelector((state) => state.auth.user);
  const articles = useAppSelector((state) => state.news.articles);
  const followedRegions = useAppSelector((state) => state.watchlist.followedRegions);
  const savedLocations = useAppSelector((state) => state.map.markers);

  const overlays = useMemo<MapOverlayRegion[]>(() => {
    return followedRegions.map((region) => ({
      id: region.id,
      label: region.name,
      centerLat: region.lat,
      centerLng: region.lng,
      radiusKm: region.radiusKm,
      importance: 'high',
    }));
  }, [followedRegions]);

  const markers = useMemo<MapOverlayMarker[]>(() => {
    const regionSignals = followedRegions.map((region) => {
      const matchCount = articles.filter((article) => {
        const haystack =
          `${article.title} ${article.description ?? ''}`.toLowerCase();
        return haystack.includes(region.name.toLowerCase());
      }).length;

      return {
        id: `region-${region.id}`,
        label: region.name,
        lat: region.lat,
        lng: region.lng,
        intensity: classifyIntensity(matchCount),
        note:
          matchCount > 0
            ? `${matchCount} matching stories in current feed`
            : 'No direct matches yet in current feed',
      };
    });

    const savedPins = savedLocations
      .filter(
        (location) => !regionSignals.some((signal) => signal.label === location.title),
      )
      .slice(0, 6)
      .map((location) => ({
        id: `saved-${location.id}`,
        label: location.title,
        lat: location.lat,
        lng: location.lng,
        intensity: 'low' as const,
        note: 'Saved operator location',
      }));

    return [...regionSignals, ...savedPins];
  }, [articles, followedRegions, savedLocations]);

  const regionSignalRows = useMemo(() => {
    return followedRegions.map((region) => {
      const signalCount = articles.filter((article) => {
        const haystack = `${article.title} ${article.description ?? ''}`.toLowerCase();
        return haystack.includes(region.name.toLowerCase());
      }).length;

      return {
        id: region.id,
        name: region.name,
        signalCount,
      };
    });
  }, [articles, followedRegions]);

  if (!user) {
    return (
      <main className="py-10 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
            Map Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Operator login required</h1>
          <p className="mt-3 text-slate-300">
            Sign in to monitor regional signals, markers, and live event convergence.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Live Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Map Intelligence
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Unified view of followed regions, saved locations, and article density around
          active intelligence zones.
        </p>
      </section>

      <MapShell
        title="Global Signal Overlay"
        subtitle="Live region tracking and marker convergence"
        mode="live"
        theme="live"
      >
        <RegionOverlayLayer regions={overlays} />
        <MarkerLayer markers={markers} />
        <div className="absolute right-4 top-4">
          <MapLegend
            mode="live"
            markerCount={markers.length}
            regionCount={overlays.length}
          />
        </div>
      </MapShell>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Operational Map
            </p>
            <h2 className="text-lg font-semibold">Interactive Pins</h2>
          </div>
          <div className="h-[420px]">
            <DynamicMap className="h-full w-full" />
          </div>
        </section>

        <section className="space-y-4">
          <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Region Signal Summary
            </p>
            {regionSignalRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No followed regions yet. Follow map pins from Dashboard to begin regional
                signal tracking.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {regionSignalRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-100">{row.name}</span>
                    <span className="text-cyan-200">{row.signalCount} matches</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Recent Feed Sample
            </p>
            {articles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Run a dashboard search to populate live feed intelligence.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {articles.slice(0, 5).map((article) => (
                  <li
                    key={article.url}
                    className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2"
                  >
                    <p className="text-sm text-slate-100">{article.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{article.source.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}
