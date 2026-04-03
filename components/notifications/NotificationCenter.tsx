'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db, getFirebaseInitializationError } from '../../lib/firebase';
import { formatUtcTimestamp } from '../../lib/dateTime';
import { NotificationChannel, UserNotification } from '../../types/notifications';

const MAX_NOTIFICATIONS = 25;

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

function mapNotification(id: string, value: unknown, uid: string): UserNotification | null {
  if (!isObject(value)) {
    return null;
  }

  const title = toString(value.title);
  const body = toString(value.body);
  const alertId = toString(value.alertId);
  const triggerEventId = toString(value.triggerEventId);
  const articleTitle = toString(value.articleTitle);
  const articleSource = toString(value.articleSource);
  const articlePublishedAt = toString(value.articlePublishedAt);
  const createdAt = toString(value.createdAt);

  if (
    !title ||
    !body ||
    !alertId ||
    !triggerEventId ||
    !articleTitle ||
    !articleSource ||
    !articlePublishedAt ||
    !createdAt
  ) {
    return null;
  }

  const channels: NotificationChannel[] = Array.isArray(value.channels)
    ? value.channels.filter(
        (channel): channel is NotificationChannel =>
          channel === 'in_app' || channel === 'email' || channel === 'push',
      )
    : ['in_app'];

  return {
    id,
    uid,
    type: value.type === 'alert_match' ? 'alert_match' : 'alert_match',
    title,
    body,
    alertId,
    triggerEventId,
    articleUrl: toString(value.articleUrl),
    articleTitle,
    articleSource,
    articlePublishedAt,
    channels,
    channelState: isObject(value.channelState)
      ? (value.channelState as UserNotification['channelState'])
      : {},
    createdAt,
    readAt: toString(value.readAt),
  };
}

interface NotificationCenterProps {
  uid: string;
}

export function NotificationCenter({ uid }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!db) {
      const initializationError = getFirebaseInitializationError();
      setError(
        initializationError?.message ?? 'Notifications are unavailable in this environment.',
      );
      setLoading(false);
      return;
    }

    try {
      const notificationsRef = collection(db, 'users', uid, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(MAX_NOTIFICATIONS),
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const next = snapshot.docs
            .map((docSnapshot) => mapNotification(docSnapshot.id, docSnapshot.data(), uid))
            .filter((notification): notification is UserNotification => notification !== null);

          setNotifications(next);
          setLoading(false);
          setError(null);
        },
        () => {
          setError('Failed to load notifications.');
          setLoading(false);
        },
      );

      return () => {
        unsubscribe();
      };
    } catch {
      setError('Failed to initialize notifications.');
      setLoading(false);
    }
  }, [uid]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const toggleRead = async (notification: UserNotification) => {
    if (!db) {
      setError('Notifications are unavailable in this environment.');
      return;
    }

    const notificationRef = doc(db, 'users', uid, 'notifications', notification.id);
    await updateDoc(notificationRef, {
      readAt: notification.readAt ? null : new Date().toISOString(),
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Notification Center</h3>
        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">
          {unreadCount} unread
        </span>
      </div>

      {loading && <p className="mt-2 text-sm text-slate-400">Loading notifications...</p>}
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="mt-2 text-sm text-slate-400">
          No notifications yet. Alert matches will appear here.
        </p>
      )}

      {notifications.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-md px-3 py-2 ${
                notification.readAt ? 'bg-slate-950/40' : 'bg-cyan-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-100">{notification.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{notification.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatUtcTimestamp(notification.createdAt)}
                  </p>
                </div>
                {!notification.readAt && (
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                    Unread
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {notification.articleUrl ? (
                  <Link
                    href={notification.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    Open Article
                  </Link>
                ) : (
                  <span className="text-slate-500">Article URL unavailable</span>
                )}
                <span className="text-slate-500">Event: {notification.triggerEventId.slice(0, 10)}</span>
                <button
                  onClick={() => {
                    void toggleRead(notification);
                  }}
                  className="rounded-md border border-white/20 px-2 py-1 text-slate-200 hover:bg-white/5"
                >
                  {notification.readAt ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
