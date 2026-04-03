'use client';

import Link from 'next/link';
import { AppPlan } from '../../types/plans';

interface UpgradePromptProps {
  title: string;
  description: string;
  targetPlan?: AppPlan;
  compact?: boolean;
}

export function UpgradePrompt({
  title,
  description,
  targetPlan = 'pro',
  compact = false,
}: UpgradePromptProps) {
  const targetLabel = targetPlan === 'team' ? 'Team' : 'Pro';

  return (
    <div
      className={`rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 ${
        compact ? 'p-3 text-xs' : 'p-4 text-sm'
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-cyan-200/90">{description}</p>
      <Link
        href="/pricing"
        className="mt-3 inline-flex rounded-md bg-cyan-400 px-3 py-1.5 font-medium text-slate-950 hover:bg-cyan-300"
      >
        Upgrade to {targetLabel}
      </Link>
    </div>
  );
}

