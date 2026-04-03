'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setFilters } from '../../store/slices/newsSlice';
import { UpgradePrompt } from '../entitlements/UpgradePrompt';
import { useEntitlements } from '../../hooks/useEntitlements';
import { CATEGORY_OPTIONS } from '../../types/preferences';
import { useAnalytics } from '../../hooks/useAnalytics';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const { filters } = useAppSelector((state) => state.news);
  const dispatch = useAppDispatch();
  const [advancedFiltersGateOpen, setAdvancedFiltersGateOpen] = useState(false);
  const { plan, entitlements } = useEntitlements();
  const { track } = useAnalytics();

  const handleFilterChange = (
    key: 'q' | 'category' | 'from' | 'to' | 'language',
    value: string,
  ) => {
    if ((key === 'from' || key === 'to') && !entitlements.advancedFiltersEnabled) {
      setAdvancedFiltersGateOpen(true);
      track('upgrade_cta_click', {
        plan: 'pro',
        location: 'advanced_filters_gate',
      });
      return;
    }

    dispatch(setFilters({ [key]: value }));
    track('filter_usage', { filter: key, value });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 md:hidden" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[85vw] max-w-sm space-y-4 border-l border-white/10 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Quick Filters</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            Close
          </button>
        </div>

        <input
          type="text"
          value={filters.q || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
          placeholder="Search query"
        />

        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filters.language || 'en'}
          onChange={(e) => handleFilterChange('language', e.target.value)}
          className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="ar">Arabic</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
        </select>

        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) => handleFilterChange('from', e.target.value)}
          disabled={!entitlements.advancedFiltersEnabled}
          className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />

        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) => handleFilterChange('to', e.target.value)}
          disabled={!entitlements.advancedFiltersEnabled}
          className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />

        {advancedFiltersGateOpen && !entitlements.advancedFiltersEnabled && (
          <UpgradePrompt
            title="Advanced filters are locked on Free"
            description="Upgrade to Pro to unlock date range and advanced filter controls."
            targetPlan={plan === 'free' ? 'pro' : 'team'}
            compact
          />
        )}
      </div>
    </div>
  );
}
