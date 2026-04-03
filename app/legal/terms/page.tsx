import { AppHeader } from '../../../components/layout/AppHeader';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />
      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm text-slate-300">
          <p>AtlasWire is provided as-is for informational and operational monitoring purposes.</p>
          <p>Users are responsible for verifying source accuracy before making legal, financial, or editorial decisions.</p>
          <p>Abuse, unauthorized scraping, or attempts to bypass rate limits may result in account suspension.</p>
        </div>
      </section>
    </main>
  );
}
