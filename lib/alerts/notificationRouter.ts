import { getFirebaseAdminDb } from '../firebaseAdmin';
import {
  AlertTriggerEvent,
  NotificationChannel,
  NotificationPreferences,
  NotificationType,
  UserNotification,
} from '../../types/notifications';

const USERS_COLLECTION = 'users';
const NOTIFICATIONS_SUBCOLLECTION = 'notifications';

const SUPPORTED_CHANNELS: NotificationChannel[] = ['in_app'];
const TOTAL_NOTIFICATIONS_TARGET = 200;
const READ_NOTIFICATIONS_TARGET = 120;
const CLEANUP_SCAN_LIMIT = 500;
const CLEANUP_MAX_DELETES_PER_RUN = 100;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

const lastCleanupByUid = new Map<string, number>();

function isReadNotification(notification: Partial<UserNotification>): boolean {
  return typeof notification.readAt === 'string' && notification.readAt.trim().length > 0;
}

function shouldRunCleanup(uid: string): boolean {
  const now = Date.now();
  const lastRun = lastCleanupByUid.get(uid);

  if (!lastRun || now - lastRun >= CLEANUP_INTERVAL_MS) {
    lastCleanupByUid.set(uid, now);
    return true;
  }

  return false;
}

async function cleanupUserNotificationsBestEffort(uid: string): Promise<void> {
  if (!shouldRunCleanup(uid)) {
    return;
  }

  const db = getFirebaseAdminDb();
  const notificationsRef = db
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection(NOTIFICATIONS_SUBCOLLECTION);
  const snapshot = await notificationsRef
    .orderBy('createdAt', 'desc')
    .limit(CLEANUP_SCAN_LIMIT)
    .get();

  if (snapshot.empty) {
    return;
  }

  const docs = snapshot.docs;
  const readDocs = docs.filter((doc) =>
    isReadNotification(doc.data() as Partial<UserNotification>),
  );

  const plannedDeletes = new Set<string>();

  if (readDocs.length > READ_NOTIFICATIONS_TARGET) {
    readDocs.slice(READ_NOTIFICATIONS_TARGET).forEach((doc) => {
      plannedDeletes.add(doc.id);
    });
  }

  if (docs.length > TOTAL_NOTIFICATIONS_TARGET) {
    const needed = docs.length - TOTAL_NOTIFICATIONS_TARGET;
    if (plannedDeletes.size < needed) {
      const readCandidatesByAge = [...readDocs].reverse();
      for (const doc of readCandidatesByAge) {
        if (plannedDeletes.size >= needed) {
          break;
        }

        plannedDeletes.add(doc.id);
      }
    }
  }

  if (plannedDeletes.size === 0) {
    return;
  }

  const batch = db.batch();
  let deleted = 0;
  for (const doc of docs.slice().reverse()) {
    if (deleted >= CLEANUP_MAX_DELETES_PER_RUN) {
      break;
    }

    if (!plannedDeletes.has(doc.id)) {
      continue;
    }

    batch.delete(doc.ref);
    deleted += 1;
  }

  if (deleted > 0) {
    await batch.commit();
  }
}

function uniqueChannels(channels: NotificationChannel[]): NotificationChannel[] {
  return Array.from(new Set(channels));
}

function normalizePreferences(
  preferences: NotificationPreferences | null,
): NotificationPreferences {
  if (!preferences) {
    return {
      enabledChannels: ['in_app'],
      muted: false,
    };
  }

  const enabledChannels = uniqueChannels(preferences.enabledChannels).filter(
    (channel): channel is NotificationChannel =>
      channel === 'in_app' || channel === 'email' || channel === 'push',
  );

  return {
    enabledChannels: enabledChannels.length > 0 ? enabledChannels : ['in_app'],
    muted: Boolean(preferences.muted),
  };
}

function getNotificationType(event: AlertTriggerEvent): NotificationType {
  return event.notificationType;
}

function toNotificationBody(event: AlertTriggerEvent): string {
  if (event.matchedTopic && event.matchedRegionName) {
    return `Matched topic "${event.matchedTopic}" in ${event.matchedRegionName}.`;
  }

  if (event.matchedTopic) {
    return `Matched topic "${event.matchedTopic}".`;
  }

  if (event.matchedRegionName) {
    return `Matched region "${event.matchedRegionName}".`;
  }

  return 'Alert conditions matched a new article.';
}

export async function routeTriggerEventToNotifications(params: {
  event: AlertTriggerEvent;
  preferences: NotificationPreferences | null;
}): Promise<void> {
  const { event } = params;
  const preferences = normalizePreferences(params.preferences);

  if (preferences.muted) {
    return;
  }

  const enabledChannels = uniqueChannels(preferences.enabledChannels);
  const channelState: UserNotification['channelState'] = {};

  enabledChannels.forEach((channel) => {
    channelState[channel] = SUPPORTED_CHANNELS.includes(channel) ? 'sent' : 'pending';
  });

  const notification: UserNotification = {
    id: event.id,
    uid: event.uid,
    type: getNotificationType(event),
    title: `Alert: ${event.articleTitle}`,
    body: toNotificationBody(event),
    alertId: event.alertId,
    triggerEventId: event.id,
    articleUrl: event.articleUrl,
    articleTitle: event.articleTitle,
    articleSource: event.articleSource,
    articlePublishedAt: event.articlePublishedAt,
    channels: enabledChannels,
    channelState,
    createdAt: event.createdAt,
    readAt: null,
  };

  const db = getFirebaseAdminDb();
  const notificationRef = db
    .collection(USERS_COLLECTION)
    .doc(event.uid)
    .collection(NOTIFICATIONS_SUBCOLLECTION)
    .doc(notification.id);

  await notificationRef.set(notification, { merge: true });

  try {
    await cleanupUserNotificationsBestEffort(event.uid);
  } catch {
    // Best-effort retention cleanup; do not fail notification creation.
  }
}
