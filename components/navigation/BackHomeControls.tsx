'use client';

import { useRouter } from 'next/navigation';

interface BackHomeControlsProps {
  homeHref?: string;
}

export function BackHomeControls({ homeHref = '/dashboard' }: BackHomeControlsProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(homeHref);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleBack}
        className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
      >
        Back
      </button>
      <button
        onClick={() => router.push(homeHref)}
        className="rounded-md border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20"
      >
        Home
      </button>
    </div>
  );
}
