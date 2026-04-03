import { NewsArticle } from './news';

export type AnalyticsEventMap = {
  login: { method: 'email'; uid: string };
  signup: { method: 'email'; uid: string };
  search: { query: string; category?: string; from?: string; to?: string };
  bookmark: { action: 'add' | 'remove'; articleUrl: string; articleTitle: string };
  article_click: { articleUrl: string; articleTitle: string; source: string; location: 'modal' | 'external' };
  filter_usage: { filter: 'q' | 'category' | 'from' | 'to' | 'language'; value: string };
  pricing_page_visit: { source: 'navigation' | 'direct' };
  upgrade_cta_click: {
    plan: 'pro' | 'team';
    location:
      | 'pricing_page'
      | 'dashboard_gate'
      | 'bookmarks_gate'
      | 'map_gate'
      | 'advanced_filters_gate'
      | 'alerts_gate'
      | 'topics_gate';
  };
};

export interface AnalyticsEvent<TName extends keyof AnalyticsEventMap> {
  name: TName;
  payload: AnalyticsEventMap[TName];
  timestamp: string;
}

export type TrackableNewsArticle = Pick<
  NewsArticle,
  'url' | 'title' | 'source'
>;
