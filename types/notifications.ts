import { SupportedCategory } from './preferences';

export type NotificationType = 'alert_match';
export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface NotificationPreferences {
  enabledChannels: NotificationChannel[];
  muted: boolean;
}

export interface AlertTriggerEvent {
  id: string;
  uid: string;
  alertId: string;
  notificationType: NotificationType;
  articleFingerprint: string;
  articleUrl: string | null;
  articleTitle: string;
  articleSource: string;
  articlePublishedAt: string;
  matchedTopic: SupportedCategory | null;
  matchedRegionId: string | null;
  matchedRegionName: string | null;
  matchedAt: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  alertId: string;
  triggerEventId: string;
  articleUrl: string | null;
  articleTitle: string;
  articleSource: string;
  articlePublishedAt: string;
  channels: NotificationChannel[];
  channelState: Partial<Record<NotificationChannel, NotificationDeliveryStatus>>;
  createdAt: string;
  readAt: string | null;
}
