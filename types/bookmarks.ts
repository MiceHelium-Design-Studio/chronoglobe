import { NewsArticle } from './news';

export interface BookmarkState {
  bookmarks: NewsArticle[];
}

export interface SubscriptionState {
  plan: 'free' | 'premium';
  status: 'active' | 'inactive';
}