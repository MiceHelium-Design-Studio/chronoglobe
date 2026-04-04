import { NewsArticle } from '../../types/news';

const knownRegions = [
  'europe',
  'asia',
  'africa',
  'middle east',
  'north america',
  'south america',
  'indo-pacific',
  'red sea',
  'ukraine',
  'china',
  'russia',
  'india',
  'israel',
];

const topicHints: Array<{ topic: string; keywords: string[] }> = [
  { topic: 'technology', keywords: ['ai', 'chip', 'software', 'tech'] },
  { topic: 'business', keywords: ['market', 'economy', 'trade', 'stock'] },
  { topic: 'conflict', keywords: ['war', 'strike', 'military', 'conflict'] },
  { topic: 'politics', keywords: ['election', 'parliament', 'policy', 'government'] },
];

function inferRegion(article: NewsArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
  const matched = knownRegions.find((region) => text.includes(region));
  return matched ? matched.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Global';
}

function inferTopic(article: NewsArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();

  for (const hint of topicHints) {
    if (hint.keywords.some((keyword) => text.includes(keyword))) {
      return hint.topic;
    }
  }

  return 'general';
}

function computeReliabilityScore(article: NewsArticle): number {
  const source = article.source.name.toLowerCase();

  if (
    source.includes('reuters') ||
    source.includes('associated press') ||
    source.includes('bbc') ||
    source.includes('bloomberg')
  ) {
    return 0.92;
  }

  if (article.description && article.description.length > 40) {
    return 0.75;
  }

  return 0.58;
}

export function enrichNewsArticle(article: NewsArticle): NewsArticle {
  const normalizedPublishedAt = new Date(article.publishedAt).toISOString();

  return {
    ...article,
    inferredRegion: inferRegion(article),
    inferredTopic: inferTopic(article),
    reliabilityScore: computeReliabilityScore(article),
    normalizedPublishedAt,
  };
}
