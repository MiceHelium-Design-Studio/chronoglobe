'use client';

import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { clearNewsError, fetchNews, setFilters } from '../../store/slices/newsSlice';
import { addBookmark, removeBookmark } from '../../store/slices/bookmarkSlice';
import { addRecentSearch } from '../../store/slices/preferencesSlice';
import { UpgradePrompt } from '../entitlements/UpgradePrompt';
import { useEntitlements } from '../../hooks/useEntitlements';
import { NewsArticle } from '../../types/news';
import { CATEGORY_OPTIONS } from '../../types/preferences';
import { useAnalytics } from '../../hooks/useAnalytics';

interface NewsListProps {
  className?: string;
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-white/10 bg-slate-900/40 px-3 py-3"
        >
          <div className="h-3.5 w-3/5 rounded bg-slate-700/60" />
          <div className="mt-2 h-2.5 w-2/5 rounded bg-slate-700/40" />
        </div>
      ))}
    </div>
  );
}

function reliabilityLabel(article: NewsArticle) {
  const source = article.source.name.toLowerCase();
  if (
    source.includes('reuters') ||
    source.includes('associated press') ||
    source.includes('bbc') ||
    source.includes('bloomberg')
  ) {
    return { label: 'High', className: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100' };
  }

  if (article.description && article.urlToImage) {
    return { label: 'Medium', className: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100' };
  }

  return { label: 'Emerging', className: 'border-amber-400/35 bg-amber-500/10 text-amber-100' };
}

function statusLabel(publishedAt: string) {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60),
  );

  if (ageHours <= 6) {
    return { label: 'Live', className: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100' };
  }

  if (ageHours <= 24) {
    return { label: 'Recent', className: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100' };
  }

  return { label: 'Archive', className: 'border-slate-500/50 bg-slate-500/10 text-slate-300' };
}

function inferRegion(article: NewsArticle, regionNames: string[]) {
  const haystack = `${article.title} ${article.description ?? ''}`.toLowerCase();

  for (const regionName of regionNames) {
    const normalized = regionName.toLowerCase();
    if (normalized.length > 0 && haystack.includes(normalized)) {
      return regionName;
    }
  }

  return 'Global desk';
}

export default function NewsList({ className }: NewsListProps) {
  const { articles, loading, error, filters } = useAppSelector((state) => state.news);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const followedRegions = useAppSelector((state) => state.watchlist.followedRegions);
  const { user } = useAppSelector((state) => state.auth);
  const preferredLanguage = useAppSelector(
    (state) => state.preferences.preferredLanguage,
  );
  const dispatch = useAppDispatch();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [bookmarkGateOpen, setBookmarkGateOpen] = useState(false);
  const [advancedFiltersGateOpen, setAdvancedFiltersGateOpen] = useState(false);
  const [queryValidationError, setQueryValidationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { plan, entitlements, canAddBookmark } = useEntitlements();
  const { track } = useAnalytics();
  const followedRegionNames = followedRegions.map((region) => region.name).slice(0, 12);

  const trimmedQuery = (filters.q ?? '').trim();
  const canSubmitSearch = trimmedQuery.length > 0 && !loading;

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
    if (key === 'q') {
      if (error) {
        dispatch(clearNewsError());
      }

      if (queryValidationError && value.trim().length > 0) {
        setQueryValidationError(null);
      }
    }
    track('filter_usage', { filter: key, value });
  };

  const handleFetchNews = () => {
    const query = (filters.q ?? '').trim();
    if (query.length === 0) {
      setQueryValidationError('Please enter a keyword, topic, or location.');
      return;
    }

    if (error) {
      dispatch(clearNewsError());
    }
    if (queryValidationError) {
      setQueryValidationError(null);
    }

    const searchPayload = {
      ...filters,
      q: query,
      language: filters.language || preferredLanguage,
      from: entitlements.advancedFiltersEnabled ? filters.from : '',
      to: entitlements.advancedFiltersEnabled ? filters.to : '',
    };

    dispatch(fetchNews(searchPayload));
    setHasSearched(true);
    dispatch(
      addRecentSearch({
        query,
        category: searchPayload.category || undefined,
        createdAt: new Date().toISOString(),
      }),
    );

    track('search', {
      query,
      category: searchPayload.category || undefined,
      from: searchPayload.from,
      to: searchPayload.to,
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleFetchNews();
  };

  const handleBookmark = (article: NewsArticle) => {
    const bookmarked = bookmarks.some((item) => item.url === article.url);

    if (bookmarked) {
      dispatch(removeBookmark(article.url));
      track('bookmark', {
        action: 'remove',
        articleUrl: article.url,
        articleTitle: article.title,
      });
      return;
    }

    if (!canAddBookmark(bookmarks.length)) {
      setBookmarkGateOpen(true);
      track('upgrade_cta_click', {
        plan: 'pro',
        location: 'bookmarks_gate',
      });
      return;
    }

    dispatch(addBookmark(article));
    track('bookmark', {
      action: 'add',
      articleUrl: article.url,
      articleTitle: article.title,
    });
  };

  const isBookmarked = (article: NewsArticle) => {
    return bookmarks.some((bookmark) => bookmark.url === article.url);
  };

  const handleOpenSummary = (article: NewsArticle) => {
    setSelectedArticle(article);
    track('article_click', {
      articleUrl: article.url,
      articleTitle: article.title,
      source: article.source.name,
      location: 'modal',
    });
  };

  const handleOpenOriginal = (article: NewsArticle) => {
    track('article_click', {
      articleUrl: article.url,
      articleTitle: article.title,
      source: article.source.name,
      location: 'external',
    });
  };

  return (
    <section
      className={`${className} flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_35px_90px_-65px_rgba(6,182,212,0.9)]`}
    >
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Events</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Event Ingestion Feed</h2>
        <p className="mt-1 text-sm text-slate-300">
          Search global sources and triage verified signals in real time.
        </p>
      </div>

      <form
        className="space-y-3 border-b border-white/10 bg-slate-900/30 px-4 py-4 sm:px-5"
        onSubmit={handleSearchSubmit}
      >
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[2fr_1fr_1fr]">
          <input
            type="text"
            placeholder="Search topics, cities, regions, or keywords"
            value={filters.q || ''}
            onChange={(e) => handleFilterChange('q', e.target.value)}
            className={`rounded-md border bg-slate-950/80 px-3 py-2 text-sm ${
              queryValidationError
                ? 'border-amber-400/80 focus-visible:outline-amber-300'
                : 'border-white/20'
            }`}
          />
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category[0].toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.language || preferredLanguage}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        {queryValidationError && (
          <p className="text-xs text-amber-200">{queryValidationError}</p>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            disabled={!entitlements.advancedFiltersEnabled}
            className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              disabled={!entitlements.advancedFiltersEnabled}
              className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSubmitSearch}
              aria-busy={loading}
            >
              {loading ? 'Searching...' : 'Run Query'}
            </button>
          </div>
        </div>

        {!entitlements.advancedFiltersEnabled && (
          <p className="text-xs text-slate-400">
            Date range filters are available on Pro and Team plans.
          </p>
        )}

        {advancedFiltersGateOpen && !entitlements.advancedFiltersEnabled && (
          <UpgradePrompt
            title="Advanced filters are locked on Free"
            description="Upgrade to Pro to unlock date-range and advanced filtering controls."
            targetPlan={plan === 'free' ? 'pro' : 'team'}
            compact
          />
        )}
      </form>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="m-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p>{error}</p>
          <button
            onClick={handleFetchNews}
            className="mt-3 rounded-md bg-rose-500 px-3 py-1.5 text-white hover:bg-rose-400"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && hasSearched && articles.length === 0 && (
        <div className="mx-4 my-8 rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
          <p className="font-medium text-slate-100">No matching articles found.</p>
          <p className="mt-1">
            Try a broader topic, another location, or fewer filters.
          </p>
        </div>
      )}

      {!loading && !error && !hasSearched && articles.length === 0 && (
        <div className="mx-4 my-8 rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
          <p className="font-medium text-slate-100">Start with a search.</p>
          <p className="mt-1">
            Use a topic, city, region, or keyword to load your first results.
          </p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="flex-1 overflow-hidden p-4">
          {bookmarkGateOpen && (
            <UpgradePrompt
              title="Bookmark limit reached"
              description={`Your current plan supports up to ${entitlements.maxBookmarks} bookmarks.`}
              targetPlan={plan === 'free' ? 'pro' : 'team'}
              compact
            />
          )}
          <div className="hidden h-full overflow-auto rounded-xl border border-white/10 bg-slate-950/55 lg:block">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950/90 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium">Event details</th>
                  <th className="px-3 py-3 font-medium">Region</th>
                  <th className="px-3 py-3 font-medium">Reliability</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => {
                  const reliability = reliabilityLabel(article);
                  const status = statusLabel(article.publishedAt);
                  const region = inferRegion(article, followedRegionNames);
                  const bookmarked = isBookmarked(article);

                  return (
                    <tr
                      key={`${article.url}-${index}`}
                      className="border-t border-white/10 align-top hover:bg-slate-900/45"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleOpenSummary(article)}
                          className="line-clamp-2 text-left font-medium text-slate-100 hover:text-cyan-200"
                        >
                          {article.title}
                        </button>
                        <p className="mt-1 text-xs text-slate-400">
                          {article.source.name} •{' '}
                          {new Date(article.publishedAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">{region}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${reliability.className}`}
                        >
                          {reliability.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => handleOpenSummary(article)}
                            className="rounded-md border border-white/20 px-2 py-1 text-slate-200 hover:bg-white/5"
                          >
                            Brief
                          </button>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleOpenOriginal(article)}
                            className="rounded-md border border-cyan-400/40 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10"
                          >
                            Source
                          </a>
                          {user && (
                            <button
                              onClick={() => handleBookmark(article)}
                              className={`rounded-md border px-2 py-1 ${
                                bookmarked
                                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                                  : 'border-white/20 text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              {bookmarked ? 'Saved' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 overflow-y-auto lg:hidden">
            {articles.map((article, index) => {
              const reliability = reliabilityLabel(article);
              const status = statusLabel(article.publishedAt);
              const region = inferRegion(article, followedRegionNames);
              const bookmarked = isBookmarked(article);

              return (
                <article
                  key={`${article.url}-${index}`}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="text-sm font-semibold text-slate-100">{article.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {article.source.name} • {new Date(article.publishedAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-slate-300">
                      {region}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 ${reliability.className}`}>
                      {reliability.label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => handleOpenSummary(article)}
                      className="rounded-md border border-white/20 px-2 py-1 text-slate-200"
                    >
                      Brief
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleOpenOriginal(article)}
                      className="rounded-md border border-cyan-400/40 px-2 py-1 text-cyan-200"
                    >
                      Source
                    </a>
                    {user && (
                      <button
                        onClick={() => handleBookmark(article)}
                        className={`rounded-md border px-2 py-1 ${
                          bookmarked
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                            : 'border-white/20 text-slate-200'
                        }`}
                      >
                        {bookmarked ? 'Saved' : 'Save'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 sm:items-center sm:p-4">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-900 p-5 sm:max-h-[80vh] sm:max-w-2xl sm:rounded-2xl sm:p-6">
            <h3 className="text-xl font-semibold text-white">{selectedArticle.title}</h3>
            <p className="mt-3 text-sm text-slate-200">
              {selectedArticle.content ||
                selectedArticle.description ||
                'No additional summary is available for this article.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
              >
                Close
              </button>
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
              >
                Read Full Article
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
