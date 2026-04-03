import { NewsFilters } from '../types/news';
import { CATEGORY_OPTIONS, SupportedCategory } from '../types/preferences';

export interface ValidatedNewsQuery {
  q: string;
  category?: SupportedCategory;
  from?: string;
  to?: string;
  language: string;
}

const allowedLanguages = new Set([
  'ar',
  'de',
  'en',
  'es',
  'fr',
  'he',
  'it',
  'nl',
  'no',
  'pt',
  'ru',
  'sv',
  'ud',
  'zh',
]);

const allowedCategories = new Set<SupportedCategory>(CATEGORY_OPTIONS);

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateNewsQuery(input: NewsFilters): ValidatedNewsQuery {
  const q = input.q?.trim();
  if (!q) {
    throw new Error('`q` is required.');
  }
  if (q.length > 120) {
    throw new Error('`q` must be 120 characters or fewer.');
  }

  const language = (input.language ?? 'en').trim().toLowerCase();
  if (!allowedLanguages.has(language)) {
    throw new Error('`language` is invalid.');
  }

  const categoryInput = (input.category ?? '').trim().toLowerCase();
  const category = categoryInput.length > 0 ? categoryInput : undefined;
  if (category && !allowedCategories.has(category as SupportedCategory)) {
    throw new Error('`category` is invalid.');
  }

  const from = input.from?.trim();
  const to = input.to?.trim();

  if (from && !isIsoDate(from)) {
    throw new Error('`from` must be formatted as YYYY-MM-DD.');
  }

  if (to && !isIsoDate(to)) {
    throw new Error('`to` must be formatted as YYYY-MM-DD.');
  }

  if (from && to && new Date(from) > new Date(to)) {
    throw new Error('`from` cannot be after `to`.');
  }

  return {
    q,
    category: category as SupportedCategory | undefined,
    from,
    to,
    language,
  };
}

export function toNewsApiSearchQuery(query: ValidatedNewsQuery): string {
  if (!query.category) {
    return query.q;
  }

  return `${query.q} AND ${query.category}`;
}
