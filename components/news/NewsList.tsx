'use client';

import { useState } from 'react';
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
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/10 bg-slate-900/50 p-4"
        >
          <div className="h-4 w-3/4 rounded bg-slate-700/60" />
          <div className="mt-3 h-3 w-full rounded bg-slate-700/50" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-700/40" />
        </div>
      ))}
    </div>
  );
}

export default function NewsList({ className }: NewsListProps) {
  const { articles, loading, error, filters } = useAppSelector((state) => state.news);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { user } = useAppSelector((state) => state.auth);
  const preferredLanguage = useAppSelector(
    (state) => state.preferences.preferredLanguage,
  );
  const dispatch = useAppDispatch();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [bookmarkGateOpen, setBookmarkGateOpen] = useState(false);
  const [advancedFiltersGateOpen, setAdvancedFiltersGateOpen] = useState(false);
  const [queryValidationError, setQueryValidationError] = useState<string | null>(null);
  const { plan, entitlements, canAddBookmark } = useEntitlements();
  const { track } = useAnalytics();

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

  return (
    <section className={`${className} flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/60`}>
      <div className="border-b border-white/10 p-4">
        <h2 className="text-xl font-semibold text-white">News Intelligence Feed</h2>
        <p className="mt-1 text-sm text-slate-300">
          Filter live headlines and curate your watchlist.
        </p>
      </div>

      <div className="space-y-3 border-b border-white/10 p-4">
        <input
          type="text"
          placeholder="Search keywords, locations, or topics"
          value={filters.q || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className={`w-full rounded-md border bg-slate-950/80 px-3 py-2 text-sm ${
            queryValidationError
              ? 'border-amber-400/80 focus-visible:outline-amber-300'
              : 'border-white/20'
          }`}
        />
        {queryValidationError && (
          <p className="text-xs text-amber-200">{queryValidationError}</p>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            disabled={!entitlements.advancedFiltersEnabled}
            className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            disabled={!entitlements.advancedFiltersEnabled}
            className="rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        {!entitlements.advancedFiltersEnabled && (
          <p className="text-xs text-slate-400">
            Date range filters are available on Pro and Team plans.
          </p>
        )}

        <button
          onClick={handleFetchNews}
          className="w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSubmitSearch}
        >
          {loading ? 'Searching...' : 'Search News'}
        </button>

        {advancedFiltersGateOpen && !entitlements.advancedFiltersEnabled && (
          <UpgradePrompt
            title="Advanced filters are locked on Free"
            description="Upgrade to Pro to unlock date-range and advanced filtering controls."
            targetPlan={plan === 'free' ? 'pro' : 'team'}
            compact
          />
        )}
      </div>

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

      {!loading && !error && articles.length === 0 && (
        <div className="mx-4 my-8 rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
          <p className="font-medium text-slate-100">No articles found yet.</p>
          <p className="mt-1">Try broadening your query or clearing date filters.</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="space-y-3 overflow-y-auto p-4">
          {bookmarkGateOpen && (
            <UpgradePrompt
              title="Bookmark limit reached"
              description={`Your current plan supports up to ${entitlements.maxBookmarks} bookmarks.`}
              targetPlan={plan === 'free' ? 'pro' : 'team'}
              compact
            />
          )}
          {articles.map((article, index) => (
            <article
              key={`${article.url}-${index}`}
              className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{article.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {article.description || 'No description available.'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {article.source.name} •{' '}
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </div>

                {user && (
                  <button
                    onClick={() => handleBookmark(article)}
                    className={`rounded px-2 py-1 text-lg ${
                      isBookmarked(article)
                        ? 'text-amber-300'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                    aria-label="Toggle bookmark"
                  >
                    ★
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button
                  onClick={() => {
                    setSelectedArticle(article);
                    track('article_click', {
                      articleUrl: article.url,
                      articleTitle: article.title,
                      source: article.source.name,
                      location: 'modal',
                    });
                  }}
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Read Summary
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    track('article_click', {
                      articleUrl: article.url,
                      articleTitle: article.title,
                      source: article.source.name,
                      location: 'external',
                    });
                  }}
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Open Original
                </a>
              </div>
            </article>
          ))}
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
