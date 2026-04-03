import { AppHeader } from '../../../components/layout/AppHeader';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />
      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm text-slate-300">
          <p>We collect account information, usage telemetry, and saved content to operate AtlasWire.</p>
          <p>We do not sell personal data. We use data to improve product reliability, security, and relevance.</p>
          <p>You can request account deletion and data export by contacting support@atlaswire.app.</p>
        </div>
      </section>
    </main>
  );
}
