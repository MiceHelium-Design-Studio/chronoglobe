import { SupportedCategory } from './preferences';

export interface NewsSource {
  id?: string | null;
  name: string;
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: NewsSource;
  author?: string | null;
  content?: string | null;
  inferredRegion?: string;
  inferredTopic?: string;
  reliabilityScore?: number;
  normalizedPublishedAt?: string;
}

export interface NewsFilters {
  category?: SupportedCategory | '';
  from?: string;
  to?: string;
  q?: string;
  language?: string;
}

export interface NewsState {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  filters: NewsFilters;
}

export interface UpstreamNewsArticle {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  source?: {
    id?: string | null;
    name?: string | null;
  } | null;
  author?: string | null;
  content?: string | null;
}
