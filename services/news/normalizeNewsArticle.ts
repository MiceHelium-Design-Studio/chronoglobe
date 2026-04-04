import { NewsArticle, UpstreamNewsArticle } from '../../types/news';

function toStringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeNewsArticle(article: UpstreamNewsArticle): NewsArticle | null {
  const title = toStringValue(article.title);
  const url = toStringValue(article.url);
  const publishedAt = toStringValue(article.publishedAt);
  const sourceName = toStringValue(article.source?.name);

  if (!title || !url || !publishedAt || !sourceName) {
    return null;
  }

  return {
    title,
    description: article.description ?? null,
    url,
    urlToImage: article.urlToImage ?? null,
    publishedAt,
    source: {
      id: article.source?.id ?? null,
      name: sourceName,
    },
    author: article.author ?? null,
    content: article.content ?? null,
  };
}
