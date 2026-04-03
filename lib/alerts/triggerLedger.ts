import { getFirebaseAdminDb } from '../firebaseAdmin';
import { AlertTriggerEvent } from '../../types/notifications';

const TRIGGER_LEDGER_COLLECTION = 'alert_trigger_events';

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string | number };
  return candidate.code === 6 || candidate.code === 'already-exists';
}

export interface TriggerLedgerWriteResult {
  created: boolean;
}

export async function writeTriggerLedgerEntry(
  event: AlertTriggerEvent,
): Promise<TriggerLedgerWriteResult> {
  const db = getFirebaseAdminDb();
  const docRef = db.collection(TRIGGER_LEDGER_COLLECTION).doc(event.id);

  try {
    await docRef.create(event);
    return { created: true };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return { created: false };
    }

    throw error;
  }
}
