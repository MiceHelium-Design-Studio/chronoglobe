import { AppHeader } from '../../../components/layout/AppHeader';

export default function DataSourcesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />
      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Data Sources</h1>
        <div className="mt-6 space-y-4 text-sm text-slate-300">
          <p>News articles are currently powered by NewsAPI and publisher syndication feeds.</p>
          <p>Map tiles are provided by OpenStreetMap contributors.</p>
          <p>Source availability and article metadata may vary by publisher licensing and regional constraints.</p>
        </div>
      </section>
    </main>
  );
}
