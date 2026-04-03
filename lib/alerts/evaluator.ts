import { getFirebaseAdminDb } from '../firebaseAdmin';
import { getPlanEntitlements } from '../entitlements';
import { toNewsApiSearchQuery } from '../newsQuery';
import { AppPlan } from '../../types/plans';
import { AlertRule, FollowedRegion } from '../../types/watchlist';
import { CATEGORY_OPTIONS, SupportedCategory } from '../../types/preferences';
import {
  AlertTriggerEvent,
  NotificationChannel,
  NotificationPreferences,
} from '../../types/notifications';
import { toArticleFingerprint, toTriggerEventId } from './fingerprint';
import { writeTriggerLedgerEntry } from './triggerLedger';
import { routeTriggerEventToNotifications } from './notificationRouter';

const USERS_COLLECTION = 'users';
const PAID_PLANS: AppPlan[] = ['pro', 'team'];
const MAX_USERS_PER_RUN = 80;
const MAX_ALERTS_PER_USER = 30;
const MAX_QUERIES_PER_USER = 8;
const QUERY_PAGE_SIZE = 20;
const NEWS_API_EVERYTHING_URL = 'https://newsapi.org/v2/everything';
const NEWS_API_TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines';
const DEFAULT_LOOKBACK_DAYS = 30;
const MAX_LOOKBACK_DAYS = 90;
const QUERY_DIAGNOSTICS_LIMIT = 80;
const DEBUG_CANDIDATES_PER_QUERY = 3;

const categorySet = new Set<SupportedCategory>(CATEGORY_OPTIONS);

interface CandidateArticle {
  title: string;
  description: string | null;
  content: string | null;
  source: string;
  publishedAt: string;
  url: string | null;
  searchText: string;
}

interface CandidateQuery {
  q: string;
  category?: SupportedCategory;
}

type QueryEndpoint = 'everything' | 'top_headlines' | 'debug';
type QueryStage =
  | 'primary'
  | 'fallback_broader_query'
  | 'fallback_extended_lookback'
  | 'fallback_top_headlines'
  | 'fallback_no_language'
  | 'debug_forced';

interface QueryDiagnostic {
  endpoint: QueryEndpoint;
  stage: QueryStage;
  query: string;
  language: string | null;
  from: string | null;
  upstreamStatus: number;
  upstreamTotalResults: number | null;
  candidateCount: number;
}

interface EvaluatorUser {
  uid: string;
  plan: AppPlan;
  preferredLanguage: string;
  alerts: AlertRule[];
  regionsById: Map<string, FollowedRegion>;
  notificationPreferences: NotificationPreferences | null;
}

export interface AlertEvaluatorSummary {
  usersScanned: number;
  eligibleUsers: number;
  alertsScanned: number;
  queriesAttempted: number;
  queryDiagnostics: QueryDiagnostic[];
  candidateArticlesScanned: number;
  finalCandidateArticleCount: number;
  matchesFound: number;
  triggerLedgerCreates: number;
  duplicateSkips: number;
  notificationsCreated: number;
  failures: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toSupportedCategory(value: unknown): SupportedCategory | null {
  if (typeof value !== 'string') {
    return null;
  }

  const next = value.toLowerCase() as SupportedCategory;
  return categorySet.has(next) ? next : null;
}

function toAllowedPlan(value: unknown): AppPlan {
  return value === 'pro' || value === 'team' ? value : 'free';
}

function sanitizeRegion(value: unknown): FollowedRegion | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.lat !== 'number' ||
    typeof value.lng !== 'number' ||
    typeof value.radiusKm !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    lat: value.lat,
    lng: value.lng,
    radiusKm: value.radiusKm,
    sourceLocationId:
      typeof value.sourceLocationId === 'string' ? value.sourceLocationId : null,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
  };
}

function sanitizeAlert(value: unknown): AlertRule | null {
  if (!isObject(value)) {
    return null;
  }

  const id = toString(value.id);
  const name = toString(value.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    topic: toSupportedCategory(value.topic),
    regionId: toString(value.regionId),
    enabled: value.enabled !== false,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof value.updatedAt === 'string'
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

function sanitizeNotificationPreferences(value: unknown): NotificationPreferences | null {
  if (!isObject(value)) {
    return null;
  }

  const enabledChannels: NotificationChannel[] = Array.isArray(value.enabledChannels)
    ? value.enabledChannels.filter(
        (channel): channel is NotificationChannel =>
          channel === 'in_app' || channel === 'email' || channel === 'push',
      )
    : ['in_app'];

  return {
    enabledChannels: enabledChannels.length > 0 ? enabledChannels : ['in_app'],
    muted: Boolean(value.muted),
  };
}

function sanitizeEvaluatorUser(uid: string, value: unknown): EvaluatorUser | null {
  if (!isObject(value)) {
    return null;
  }

  const plan = toAllowedPlan((value.billing as { plan?: unknown } | undefined)?.plan);
  const planEntitlements = getPlanEntitlements(plan);
  if (!planEntitlements.alertsEnabled) {
    return null;
  }

  const watchlist = isObject(value.watchlist) ? value.watchlist : {};
  const alerts = Array.isArray(watchlist.alerts)
    ? watchlist.alerts
        .map((alert) => sanitizeAlert(alert))
        .filter((alert): alert is AlertRule => alert !== null && alert.enabled)
        .slice(0, MAX_ALERTS_PER_USER)
    : [];

  if (alerts.length === 0) {
    return null;
  }

  const regions = Array.isArray(watchlist.followedRegions)
    ? watchlist.followedRegions
        .map((region) => sanitizeRegion(region))
        .filter((region): region is FollowedRegion => region !== null)
    : [];
  const regionsById = new Map(regions.map((region) => [region.id, region]));

  const preferredLanguage =
    toString((value.preferences as { preferredLanguage?: unknown } | undefined)?.preferredLanguage) ??
    'en';

  return {
    uid,
    plan,
    preferredLanguage,
    alerts,
    regionsById,
    notificationPreferences: sanitizeNotificationPreferences(value.notificationPreferences),
  };
}

function toCandidateQuery(
  alert: AlertRule,
  regionsById: Map<string, FollowedRegion>,
): CandidateQuery | null {
  const regionName = alert.regionId ? regionsById.get(alert.regionId)?.name : null;

  if (alert.topic && regionName) {
    return {
      q: `${alert.topic} ${regionName}`,
      category: alert.topic,
    };
  }

  if (alert.topic) {
    return {
      q: alert.topic,
      category: alert.topic,
    };
  }

  if (regionName) {
    return {
      q: regionName,
    };
  }

  return null;
}

function buildCandidateQueries(user: EvaluatorUser): CandidateQuery[] {
  const unique = new Map<string, CandidateQuery>();

  user.alerts.forEach((alert) => {
    const query = toCandidateQuery(alert, user.regionsById);
    if (!query) {
      return;
    }

    const key = `${query.q.toLowerCase()}::${query.category ?? ''}`;
    if (!unique.has(key)) {
      unique.set(key, query);
    }
  });

  return Array.from(unique.values()).slice(0, MAX_QUERIES_PER_USER);
}

function mapCandidateArticle(value: unknown): CandidateArticle | null {
  if (!isObject(value)) {
    return null;
  }

  const title = toString(value.title);
  const sourceName = toString((value.source as { name?: unknown } | undefined)?.name);
  const publishedAt = toString(value.publishedAt);

  if (!title || !sourceName || !publishedAt) {
    return null;
  }

  const description = toString(value.description);
  const content = toString(value.content);
  const url = toString(value.url);

  const searchText = [
    title,
    description,
    content,
    sourceName,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase();

  return {
    title,
    description,
    content,
    source: sourceName,
    publishedAt,
    url,
    searchText,
  };
}

function parseLookbackDays(): number {
  const raw = Number.parseInt(
    process.env.ALERT_EVALUATOR_LOOKBACK_DAYS ?? '',
    10,
  );

  if (Number.isNaN(raw)) {
    return DEFAULT_LOOKBACK_DAYS;
  }

  return Math.min(Math.max(raw, 1), MAX_LOOKBACK_DAYS);
}

function pushQueryDiagnostics(
  summary: AlertEvaluatorSummary,
  diagnostics: QueryDiagnostic[],
): void {
  summary.queriesAttempted += diagnostics.length;
  diagnostics.forEach((diagnostic) => {
    if (summary.queryDiagnostics.length >= QUERY_DIAGNOSTICS_LIMIT) {
      return;
    }

    summary.queryDiagnostics.push(diagnostic);
  });
}

function toFromIso(lookbackDays: number): string {
  return new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
}

function toQueryString(
  query: CandidateQuery,
  includeCategory: boolean,
): string {
  return includeCategory
    ? toNewsApiSearchQuery({
        q: query.q,
        category: query.category,
        language: 'en',
      })
    : query.q;
}

function buildFallbackQueryStrings(query: CandidateQuery): string[] {
  const values = new Set<string>();
  const withCategory = toQueryString(query, true);
  if (withCategory.trim().length > 0) {
    values.add(withCategory);
  }

  if (query.q.trim().length > 0) {
    values.add(query.q);
  }

  if (query.category) {
    values.add(query.category);
  }

  values.add('news');
  return Array.from(values);
}

function buildDebugCandidateArticles(query: CandidateQuery): CandidateArticle[] {
  const now = '2026-01-01T00:00:00.000Z';

  return Array.from({ length: DEBUG_CANDIDATES_PER_QUERY }, (_, index) => {
    const url = `https://debug.local/alerts/${encodeURIComponent(
      query.q.toLowerCase(),
    )}-${index + 1}`;
    const title = `Debug alert candidate for ${query.q} #${index + 1}`;
    const description = `Debug candidate generated for query "${query.q}".`;
    const source = 'AtlasWire Debug Feed';
    const searchText = `${title} ${description} ${source}`.toLowerCase();

    return {
      title,
      description,
      content: description,
      source,
      publishedAt: now,
      url,
      searchText,
    };
  });
}

async function fetchEverythingAttempt(params: {
  queryString: string;
  preferredLanguage: string;
  newsApiKey: string;
  lookbackDays: number;
  includeLanguage: boolean;
  includeFrom: boolean;
  stage: QueryStage;
}): Promise<{ articles: CandidateArticle[]; diagnostic: QueryDiagnostic }> {
  const url = new URL(NEWS_API_EVERYTHING_URL);
  url.searchParams.set('q', params.queryString);
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', QUERY_PAGE_SIZE.toString());

  const from = params.includeFrom ? toFromIso(params.lookbackDays) : null;

  if (from) {
    url.searchParams.set('from', from);
  }

  if (params.includeLanguage) {
    url.searchParams.set('language', params.preferredLanguage);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': params.newsApiKey,
    },
  });

  const json = (await response.json().catch(() => null)) as unknown;

  if (!response.ok || !isObject(json) || json.status !== 'ok') {
    return {
      articles: [],
      diagnostic: {
        endpoint: 'everything',
        stage: params.stage,
        query: params.queryString,
        language: params.includeLanguage ? params.preferredLanguage : null,
        from,
        upstreamStatus: response.status,
        upstreamTotalResults: isObject(json) && typeof json.totalResults === 'number'
          ? json.totalResults
          : null,
        candidateCount: 0,
      },
    };
  }

  const rawArticles = Array.isArray(json.articles) ? json.articles : [];
  const articles = rawArticles
    .map((article) => mapCandidateArticle(article))
    .filter((article): article is CandidateArticle => article !== null);

  return {
    articles,
    diagnostic: {
      endpoint: 'everything',
      stage: params.stage,
      query: params.queryString,
      language: params.includeLanguage ? params.preferredLanguage : null,
      from,
      upstreamStatus: response.status,
      upstreamTotalResults:
        typeof json.totalResults === 'number' ? json.totalResults : null,
      candidateCount: articles.length,
    },
  };
}

async function fetchTopHeadlinesAttempt(params: {
  queryString: string;
  category?: SupportedCategory;
  preferredLanguage: string;
  newsApiKey: string;
  includeLanguage: boolean;
}): Promise<{ articles: CandidateArticle[]; diagnostic: QueryDiagnostic }> {
  const url = new URL(NEWS_API_TOP_HEADLINES_URL);
  url.searchParams.set('q', params.queryString);
  url.searchParams.set('pageSize', QUERY_PAGE_SIZE.toString());

  if (params.category) {
    url.searchParams.set('category', params.category);
  }

  if (params.includeLanguage) {
    url.searchParams.set('language', params.preferredLanguage);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': params.newsApiKey,
    },
  });

  const json = (await response.json().catch(() => null)) as unknown;

  if (!response.ok || !isObject(json) || json.status !== 'ok') {
    return {
      articles: [],
      diagnostic: {
        endpoint: 'top_headlines',
        stage: params.includeLanguage
          ? 'fallback_top_headlines'
          : 'fallback_no_language',
        query: params.queryString,
        language: params.includeLanguage ? params.preferredLanguage : null,
        from: null,
        upstreamStatus: response.status,
        upstreamTotalResults:
          isObject(json) && typeof json.totalResults === 'number'
            ? json.totalResults
            : null,
        candidateCount: 0,
      },
    };
  }

  const rawArticles = Array.isArray(json.articles) ? json.articles : [];
  const articles = rawArticles
    .map((article) => mapCandidateArticle(article))
    .filter((article): article is CandidateArticle => article !== null);

  return {
    articles,
    diagnostic: {
      endpoint: 'top_headlines',
      stage: params.includeLanguage
        ? 'fallback_top_headlines'
        : 'fallback_no_language',
      query: params.queryString,
      language: params.includeLanguage ? params.preferredLanguage : null,
      from: null,
      upstreamStatus: response.status,
      upstreamTotalResults:
        typeof json.totalResults === 'number' ? json.totalResults : null,
      candidateCount: articles.length,
    },
  };
}

async function fetchCandidateArticlesWithFallback(params: {
  query: CandidateQuery;
  preferredLanguage: string;
  newsApiKey: string;
  lookbackDays: number;
  debugForceCandidates: boolean;
}): Promise<{ articles: CandidateArticle[]; diagnostics: QueryDiagnostic[] }> {
  if (params.debugForceCandidates) {
    const articles = buildDebugCandidateArticles(params.query);
    return {
      articles,
      diagnostics: [
        {
          endpoint: 'debug',
          stage: 'debug_forced',
          query: params.query.q,
          language: params.preferredLanguage,
          from: null,
          upstreamStatus: 200,
          upstreamTotalResults: articles.length,
          candidateCount: articles.length,
        },
      ],
    };
  }

  const diagnostics: QueryDiagnostic[] = [];
  const fallbackQueries = buildFallbackQueryStrings(params.query);
  const primaryQuery = fallbackQueries[0] ?? params.query.q;

  const primary = await fetchEverythingAttempt({
    queryString: primaryQuery,
    preferredLanguage: params.preferredLanguage,
    newsApiKey: params.newsApiKey,
    lookbackDays: params.lookbackDays,
    includeLanguage: true,
    includeFrom: true,
    stage: 'primary',
  });
  diagnostics.push(primary.diagnostic);
  if (primary.articles.length > 0) {
    return { articles: primary.articles, diagnostics };
  }

  const broaderQuery = fallbackQueries.find(
    (query) => query.toLowerCase() !== primaryQuery.toLowerCase(),
  );
  if (broaderQuery) {
    const broader = await fetchEverythingAttempt({
      queryString: broaderQuery,
      preferredLanguage: params.preferredLanguage,
      newsApiKey: params.newsApiKey,
      lookbackDays: params.lookbackDays,
      includeLanguage: true,
      includeFrom: true,
      stage: 'fallback_broader_query',
    });
    diagnostics.push(broader.diagnostic);
    if (broader.articles.length > 0) {
      return { articles: broader.articles, diagnostics };
    }
  }

  const expandedLookback = Math.min(params.lookbackDays * 2, MAX_LOOKBACK_DAYS);
  if (expandedLookback > params.lookbackDays) {
    const extended = await fetchEverythingAttempt({
      queryString: params.query.q,
      preferredLanguage: params.preferredLanguage,
      newsApiKey: params.newsApiKey,
      lookbackDays: expandedLookback,
      includeLanguage: true,
      includeFrom: true,
      stage: 'fallback_extended_lookback',
    });
    diagnostics.push(extended.diagnostic);
    if (extended.articles.length > 0) {
      return { articles: extended.articles, diagnostics };
    }
  }

  const topHeadlines = await fetchTopHeadlinesAttempt({
    queryString: params.query.q,
    category: params.query.category,
    preferredLanguage: params.preferredLanguage,
    newsApiKey: params.newsApiKey,
    includeLanguage: true,
  });
  diagnostics.push(topHeadlines.diagnostic);
  if (topHeadlines.articles.length > 0) {
    return { articles: topHeadlines.articles, diagnostics };
  }

  const noLanguage = await fetchEverythingAttempt({
    queryString: params.query.q,
    preferredLanguage: params.preferredLanguage,
    newsApiKey: params.newsApiKey,
    lookbackDays: expandedLookback,
    includeLanguage: false,
    includeFrom: false,
    stage: 'fallback_no_language',
  });
  diagnostics.push(noLanguage.diagnostic);

  return { articles: noLanguage.articles, diagnostics };
}

function matchTopic(alert: AlertRule, article: CandidateArticle): boolean {
  if (!alert.topic) {
    return true;
  }

  return article.searchText.includes(alert.topic.toLowerCase());
}

function matchRegion(
  alert: AlertRule,
  article: CandidateArticle,
  regionsById: Map<string, FollowedRegion>,
): boolean {
  if (!alert.regionId) {
    return true;
  }

  const region = regionsById.get(alert.regionId);
  if (!region) {
    return false;
  }

  return article.searchText.includes(region.name.toLowerCase());
}

export async function evaluateActiveAlerts(params: {
  newsApiKey: string;
  debugForceCandidates?: boolean;
}): Promise<AlertEvaluatorSummary> {
  const lookbackDays = parseLookbackDays();
  const debugForceCandidates =
    process.env.NODE_ENV !== 'production' && params.debugForceCandidates === true;
  const db = getFirebaseAdminDb();
  const usersSnapshot = await db
    .collection(USERS_COLLECTION)
    .where('billing.plan', 'in', PAID_PLANS)
    .limit(MAX_USERS_PER_RUN)
    .get();

  const summary: AlertEvaluatorSummary = {
    usersScanned: usersSnapshot.size,
    eligibleUsers: 0,
    alertsScanned: 0,
    queriesAttempted: 0,
    queryDiagnostics: [],
    candidateArticlesScanned: 0,
    finalCandidateArticleCount: 0,
    matchesFound: 0,
    triggerLedgerCreates: 0,
    duplicateSkips: 0,
    notificationsCreated: 0,
    failures: 0,
  };

  for (const doc of usersSnapshot.docs) {
    const user = sanitizeEvaluatorUser(doc.id, doc.data());
    if (!user) {
      continue;
    }

    summary.eligibleUsers += 1;
    summary.alertsScanned += user.alerts.length;

    try {
      const queries = buildCandidateQueries(user);
      if (queries.length === 0) {
        continue;
      }

      const articlesMap = new Map<string, CandidateArticle>();
      for (const query of queries) {
        try {
          const fetched = await fetchCandidateArticlesWithFallback({
            query,
            preferredLanguage: user.preferredLanguage,
            newsApiKey: params.newsApiKey,
            lookbackDays,
            debugForceCandidates,
          });
          pushQueryDiagnostics(summary, fetched.diagnostics);

          fetched.articles.forEach((article) => {
            const articleFingerprint = toArticleFingerprint({
              url: article.url,
              title: article.title,
              source: article.source,
              publishedAt: article.publishedAt,
            });

            if (!articlesMap.has(articleFingerprint)) {
              articlesMap.set(articleFingerprint, article);
            }
          });
        } catch {
          summary.failures += 1;
        }
      }

      const uniqueArticles = Array.from(articlesMap.entries());
      summary.candidateArticlesScanned += uniqueArticles.length;
      summary.finalCandidateArticleCount = summary.candidateArticlesScanned;

      for (const alert of user.alerts) {
        for (const [articleFingerprint, article] of uniqueArticles) {
          const matchesTopic = matchTopic(alert, article);
          const matchesRegion = matchRegion(alert, article, user.regionsById);

          if (!matchesTopic || !matchesRegion) {
            continue;
          }

          summary.matchesFound += 1;

          const region = alert.regionId ? user.regionsById.get(alert.regionId) ?? null : null;
          const now = new Date().toISOString();
          const event: AlertTriggerEvent = {
            id: toTriggerEventId({
              uid: user.uid,
              alertId: alert.id,
              articleFingerprint,
            }),
            uid: user.uid,
            alertId: alert.id,
            notificationType: 'alert_match',
            articleFingerprint,
            articleUrl: article.url,
            articleTitle: article.title,
            articleSource: article.source,
            articlePublishedAt: article.publishedAt,
            matchedTopic: alert.topic,
            matchedRegionId: region?.id ?? null,
            matchedRegionName: region?.name ?? null,
            matchedAt: now,
            createdAt: now,
          };

          let ledgerCreated = false;
          try {
            const ledger = await writeTriggerLedgerEntry(event);
            if (!ledger.created) {
              summary.duplicateSkips += 1;
              continue;
            }

            ledgerCreated = true;
            summary.triggerLedgerCreates += 1;
          } catch {
            summary.failures += 1;
            continue;
          }

          if (!ledgerCreated) {
            continue;
          }

          try {
            await routeTriggerEventToNotifications({
              event,
              preferences: user.notificationPreferences,
            });
            summary.notificationsCreated += 1;
          } catch {
            summary.failures += 1;
          }
        }
      }
    } catch {
      summary.failures += 1;
    }
  }

  return summary;
}
