// Server-only data layer for tuitions and class logs.
// Everything here uses the Firebase Admin SDK. Never import this from a client component.
import { randomBytes, randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore, Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition, ClassLog, MonthRecord, Payment } from '@/types';

type NewTuition = Omit<Tuition, 'id' | 'createdAt' | 'updatedAt' | 'cycleId' | 'cycleStartedAt' | 'currentPayment'>;

/** Tuitions and logs from before month history have no cycleId; they share this implicit cycle. */
export const LEGACY_CYCLE = 'legacy';

export function cycleOfTuition(tuition: Pick<Tuition, 'cycleId'>): string {
  return tuition.cycleId ?? LEGACY_CYCLE;
}

export function cycleOfLog(log: Pick<ClassLog, 'cycleId'>): string {
  return log.cycleId ?? LEGACY_CYCLE;
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return monthKey();
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** Receipt number for a payment slip, e.g. TT-202611-7K3QF. */
export function makeSlipNo(month: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `TT-${month.replace('-', '')}-${suffix}`;
}

/**
 * Marks a month's fee paid or unpaid. `monthId` = 'current' for the open month, else a
 * closed month's record id. Marking paid assigns a slip number (kept if re-marked).
 * Caller must have verified the user owns the tuition.
 */
export async function setPayment(
  tuition: Tuition,
  monthId: string,
  paid: boolean,
  amount: number | null,
  userId: string
): Promise<{ success: boolean; message: string; payment?: Payment }> {
  const adminDb = getAdminDb();
  const tuitionRef = adminDb.collection('tuitions').doc(tuition.id);

  return adminDb.runTransaction(async (tx) => {
    if (monthId === 'current') {
      const snap = await tx.get(tuitionRef);
      const t = snap.data() as Tuition;
      const prev = t.currentPayment;
      const payment: Payment = paid
        ? {
            paid: true,
            amount: amount ?? prev?.amount ?? t.feeAmount ?? null,
            paidAt: new Date(),
            slipNo: prev?.slipNo ?? makeSlipNo(t.currentMonthYear),
            markedBy: userId,
          }
        : { paid: false, amount: amount ?? prev?.amount ?? t.feeAmount ?? null, slipNo: prev?.slipNo ?? null };
      tx.update(tuitionRef, { currentPayment: payment, updatedAt: new Date() });
      return { success: true, message: paid ? 'Marked as paid' : 'Marked as unpaid', payment };
    }

    const recordRef = tuitionRef.collection('months').doc(monthId);
    const snap = await tx.get(recordRef);
    if (!snap.exists) return { success: false, message: 'Month not found' };
    const record = snap.data() as MonthRecord;
    const prev = record.payment;
    const payment: Payment = paid
      ? {
          paid: true,
          amount: amount ?? prev?.amount ?? tuition.feeAmount ?? null,
          paidAt: new Date(),
          slipNo: prev?.slipNo ?? makeSlipNo(record.monthYear),
          markedBy: userId,
        }
      : { paid: false, amount: amount ?? prev?.amount ?? null, slipNo: prev?.slipNo ?? null };
    tx.update(recordRef, { payment });
    return { success: true, message: paid ? 'Marked as paid' : 'Marked as unpaid', payment };
  });
}

/** Current-month class dates (ISO strings) for each tuition, keyed by tuition id. */
export async function getCurrentClassDatesFor(tuitions: Tuition[]): Promise<Record<string, string[]>> {
  const entries = await Promise.all(
    tuitions.map(async (t) => {
      const logs = await getClassDates(t);
      return [
        t.id,
        logs.map((l) => {
          const d = (l.classDate ?? l.createdAt) as unknown as { toDate?: () => Date };
          return (typeof d?.toDate === 'function' ? d.toDate() : new Date(d as unknown as string)).toISOString();
        }),
      ] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function createTuition(
  tuitionData: NewTuition
): Promise<{ success: boolean; message: string; tuitionId?: string }> {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('tuitions').doc();
    const now = new Date();

    const batch = adminDb.batch();
    batch.set(docRef, {
      ...tuitionData,
      id: docRef.id,
      cycleId: randomUUID(),
      cycleStartedAt: now,
      currentPayment: { paid: false, amount: tuitionData.feeAmount ?? null },
      createdAt: now,
      updatedAt: now,
    });
    batch.update(adminDb.collection('users').doc(tuitionData.teacherId), {
      linkedTuitions: FieldValue.arrayUnion(docRef.id),
    });
    if (tuitionData.studentId) {
      batch.update(adminDb.collection('users').doc(tuitionData.studentId), {
        linkedTuitions: FieldValue.arrayUnion(docRef.id),
      });
    }
    await batch.commit();

    return { success: true, message: 'Tuition created successfully', tuitionId: docRef.id };
  } catch (error) {
    console.error('Error creating tuition:', error);
    return { success: false, message: 'Failed to create tuition' };
  }
}

export async function getTuitionsByTeacher(teacherId: string): Promise<Tuition[]> {
  try {
    const snap = await getAdminDb()
      .collection('tuitions')
      .where('teacherId', '==', teacherId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Tuition));
  } catch (error) {
    console.error('Error fetching teacher tuitions:', error);
    return [];
  }
}

export async function getTuitionsByStudent(studentId: string): Promise<Tuition[]> {
  try {
    const snap = await getAdminDb()
      .collection('tuitions')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Tuition));
  } catch (error) {
    console.error('Error fetching student tuitions:', error);
    return [];
  }
}

/**
 * Adds or removes one class. The count change and its log entry are written in a
 * single transaction, so rapid taps cannot lose updates or leave the two out of sync.
 * Caller must have already verified the user owns the tuition.
 */
export async function updateClassCount(
  tuitionId: string,
  action: 'increment' | 'decrement',
  userId: string,
  userName: string,
  classDate?: Date,
  note?: string
): Promise<{ success: boolean; message: string; logId?: string }> {
  try {
    const adminDb = getAdminDb();
    const tuitionRef = adminDb.collection('tuitions').doc(tuitionId);
    const logRef = adminDb.collection('classLogs').doc();

    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(tuitionRef);
      if (!snap.exists) {
        return { success: false, message: 'Tuition not found' };
      }

      const tuition = snap.data() as Tuition;
      const current = tuition.takenClasses || 0;
      if (action === 'decrement' && current <= 0) {
        return { success: false, message: 'Cannot decrement below 0' };
      }

      const now = new Date();
      tx.update(tuitionRef, {
        takenClasses: FieldValue.increment(action === 'increment' ? 1 : -1),
        updatedAt: now,
      });
      tx.set(logRef, {
        tuitionId,
        actionType: action,
        addedBy: userId,
        addedByName: userName,
        date: now,
        createdAt: now,
        // Legacy tuitions keep writing un-stamped logs until their first month close.
        ...(tuition.cycleId && { cycleId: tuition.cycleId }),
        ...(action === 'increment' && { classDate: classDate ?? now }),
        ...(note && { description: note }),
      });

      return { success: true, message: action === 'increment' ? 'Class logged' : 'Class removed', logId: logRef.id };
    });
  } catch (error) {
    console.error('Error updating class count:', error);
    return { success: false, message: 'Failed to update class count' };
  }
}

/**
 * Activity log for one month of a tuition (defaults to the current open month), newest first.
 * Filtering by cycle happens in memory: a tuition has at most a few hundred logs, and this
 * avoids a new composite index and works for legacy logs without a cycleId.
 */
export async function getClassLogs(tuition: Tuition, cycleId = cycleOfTuition(tuition)): Promise<ClassLog[]> {
  try {
    const snap = await getAdminDb()
      .collection('classLogs')
      .where('tuitionId', '==', tuition.id)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id } as ClassLog))
      .filter((log) => cycleOfLog(log) === cycleId);
  } catch (error) {
    console.error('Error fetching class logs:', error);
    return [];
  }
}

/** Classes taken (increment logs) in one month of a tuition, newest class date first. */
export async function getClassDates(tuition: Tuition, cycleId = cycleOfTuition(tuition)): Promise<ClassLog[]> {
  try {
    const snap = await getAdminDb()
      .collection('classLogs')
      .where('tuitionId', '==', tuition.id)
      .where('actionType', '==', 'increment')
      .orderBy('classDate', 'desc')
      .get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id } as ClassLog))
      .filter((log) => cycleOfLog(log) === cycleId);
  } catch (error) {
    console.error('Error fetching class dates:', error);
    return [];
  }
}

/** Closed months for a tuition, newest first. */
export async function getMonthHistory(tuitionId: string): Promise<MonthRecord[]> {
  const snap = await getAdminDb()
    .collection('tuitions')
    .doc(tuitionId)
    .collection('months')
    .orderBy('closedAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MonthRecord));
}

/** Deletes every document matched by `q`, in chunks that stay under the 500-op batch limit. */
async function deleteQueryInChunks(adminDb: Firestore, q: Query): Promise<number> {
  let deleted = 0;
  for (;;) {
    const snap = await q.limit(400).get();
    if (snap.empty) return deleted;
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
  }
}

/**
 * Closes the current month: saves a summary record (planned vs taken, class dates) under
 * tuitions/{id}/months/{cycleId}, then starts a new month with a fresh cycleId and count 0.
 * Class logs are kept, so every past month stays viewable and exportable.
 */
export async function closeMonth(
  tuition: Tuition,
  userId: string,
  userName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminDb = getAdminDb();
    const closingCycle = cycleOfTuition(tuition);
    const classDates = (await getClassDates(tuition, closingCycle))
      .map((log) => log.classDate ?? log.createdAt)
      .reverse(); // oldest first

    const tuitionRef = adminDb.collection('tuitions').doc(tuition.id);
    const recordRef = tuitionRef.collection('months').doc(closingCycle);
    const now = new Date();

    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(tuitionRef);
      if (!fresh.exists) throw new Error('Tuition not found');
      const freshTuition = fresh.data() as Tuition;
      // Someone else closed this month in the meantime: do nothing.
      if (cycleOfTuition(freshTuition) !== closingCycle) return;

      tx.set(recordRef, {
        tuitionId: tuition.id,
        monthYear: freshTuition.currentMonthYear,
        plannedClasses: freshTuition.plannedClassesPerMonth,
        takenClasses: freshTuition.takenClasses || 0,
        classDates,
        closedAt: now,
        closedBy: userId,
        closedByName: userName,
        payment: freshTuition.currentPayment ?? {
          paid: false,
          amount: freshTuition.feeAmount ?? null,
        },
      });

      // The new month is the later of "the month after the one just closed" and "this month",
      // so closing a few days early or late both get the right label.
      const after = nextMonthKey(freshTuition.currentMonthYear);
      const nowKey = monthKey(now);
      tx.update(tuitionRef, {
        cycleId: randomUUID(),
        cycleStartedAt: now,
        takenClasses: 0,
        currentMonthYear: nowKey > after ? nowKey : after,
        currentPayment: { paid: false, amount: freshTuition.feeAmount ?? null },
        updatedAt: now,
      });
    });

    return { success: true, message: 'Month closed. A new month has started.' };
  } catch (error) {
    console.error('Error closing month:', error);
    return { success: false, message: 'Failed to close month' };
  }
}

/**
 * Deletes a tuition together with its class logs and homework (including comments),
 * and unlinks it from the teacher and student. Caller must have verified ownership.
 */
export async function deleteTuition(tuitionId: string): Promise<{ success: boolean; message: string }> {
  try {
    const adminDb = getAdminDb();
    const tuitionRef = adminDb.collection('tuitions').doc(tuitionId);
    const snap = await tuitionRef.get();
    if (!snap.exists) {
      return { success: false, message: 'Tuition not found' };
    }
    const tuition = snap.data() as Tuition;

    await deleteQueryInChunks(adminDb, adminDb.collection('classLogs').where('tuitionId', '==', tuitionId));

    const homework = await adminDb.collection('homework').where('tuitionId', '==', tuitionId).get();
    for (const hw of homework.docs) {
      await adminDb.recursiveDelete(hw.ref); // removes the comments subcollection too
    }

    const userRefs = [tuition.teacherId, tuition.studentId]
      .filter((id): id is string => !!id)
      .map((id) => adminDb.collection('users').doc(id));
    const userSnaps = await adminDb.getAll(...userRefs);

    const batch = adminDb.batch();
    userSnaps
      .filter((u) => u.exists)
      .forEach((u) => batch.update(u.ref, { linkedTuitions: FieldValue.arrayRemove(tuitionId) }));
    await batch.commit();

    // Deletes the tuition and its months/ history subcollection.
    await adminDb.recursiveDelete(tuitionRef);

    return { success: true, message: 'Tuition deleted successfully' };
  } catch (error) {
    console.error('Error deleting tuition:', error);
    return { success: false, message: 'Failed to delete tuition' };
  }
}
