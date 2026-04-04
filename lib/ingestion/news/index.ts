import { dedupeNews } from '../../../services/news/dedupeNews';
import { enrichNewsArticle } from '../../../services/news/enrichNewsArticle';
import { normalizeNewsArticle } from '../../../services/news/normalizeNewsArticle';
import { NewsArticle, UpstreamNewsArticle } from '../../../types/news';

export interface NewsIngestionResult {
  articles: NewsArticle[];
  inputCount: number;
  normalizedCount: number;
  dedupedCount: number;
}

export function ingestNewsArticles(input: UpstreamNewsArticle[]): NewsIngestionResult {
  const normalized = input
    .map((article) => normalizeNewsArticle(article))
    .filter((article): article is NewsArticle => article !== null);

  const deduped = dedupeNews(normalized);
  const enriched = deduped.map((article) => enrichNewsArticle(article));

  return {
    articles: enriched,
    inputCount: input.length,
    normalizedCount: normalized.length,
    dedupedCount: deduped.length,
  };
}
