export type UserDataSyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'synced'
  | 'error';

export interface UserDataSyncState {
  status: UserDataSyncStatus;
  activeUid: string | null;
  error: string | null;
  lastSyncedAt: string | null;
}
