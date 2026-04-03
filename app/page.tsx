import Link from 'next/link';
import { AppHeader } from '../components/layout/AppHeader';

const features = [
  {
    title: 'Live Geo News Layer',
    description:
      'Track breaking events directly on an interactive map and zoom by region in seconds.',
  },
  {
    title: 'Signal-First Search',
    description:
      'Filter by keyword, topic, language, and date to isolate high-signal stories fast.',
  },
  {
    title: 'Personal Intelligence Feed',
    description:
      'Save bookmarks, follow categories, and keep a timeline of your recent investigations.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_45%),linear-gradient(180deg,_#020617,_#0f172a)] text-slate-100">
      <AppHeader />

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-24">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            Real-Time Map News Platform
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Understand global events where they happen.
          </h1>
          <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
            AtlasWire combines live news search with map intelligence so teams can
            monitor regions, verify sources, and spot trends before they escalate.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Explore Map
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_60px_-20px_rgba(34,211,238,0.45)]">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <ol className="mt-4 space-y-4 text-sm text-slate-300">
            <li>1. Search headlines by keyword and timeframe.</li>
            <li>2. Filter the feed by category and language.</li>
            <li>3. Save priority stories and follow strategic topics.</li>
            <li>4. Return to your dashboard for quick context recall.</li>
          </ol>
          <p className="mt-6 rounded-lg border border-white/10 bg-slate-800/60 p-4 text-sm text-slate-200">
            Built for analysts, journalists, and product teams that need location-aware
            situational awareness in one workspace.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-slate-900/65 p-6"
            >
              <h3 className="text-lg font-semibold text-cyan-200">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
