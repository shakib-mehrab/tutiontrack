// Server-only data layer for tuitions and class logs.
// Everything here uses the Firebase Admin SDK. Never import this from a client component.
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore, Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition, ClassLog } from '@/types';

type NewTuition = Omit<Tuition, 'id' | 'createdAt' | 'updatedAt'>;

export async function createTuition(
  tuitionData: NewTuition
): Promise<{ success: boolean; message: string; tuitionId?: string }> {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('tuitions').doc();
    const now = new Date();

    const batch = adminDb.batch();
    batch.set(docRef, { ...tuitionData, id: docRef.id, createdAt: now, updatedAt: now });
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
  classDate?: Date
): Promise<{ success: boolean; message: string }> {
  try {
    const adminDb = getAdminDb();
    const tuitionRef = adminDb.collection('tuitions').doc(tuitionId);
    const logRef = adminDb.collection('classLogs').doc();

    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(tuitionRef);
      if (!snap.exists) {
        return { success: false, message: 'Tuition not found' };
      }

      const current = (snap.data() as Tuition).takenClasses || 0;
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
        ...(action === 'increment' && { classDate: classDate ?? now }),
      });

      return { success: true, message: `Class count ${action}ed successfully` };
    });
  } catch (error) {
    console.error('Error updating class count:', error);
    return { success: false, message: 'Failed to update class count' };
  }
}

export async function getClassLogs(tuitionId: string): Promise<ClassLog[]> {
  try {
    const snap = await getAdminDb()
      .collection('classLogs')
      .where('tuitionId', '==', tuitionId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ClassLog));
  } catch (error) {
    console.error('Error fetching class logs:', error);
    return [];
  }
}

export async function getClassDates(tuitionId: string): Promise<ClassLog[]> {
  try {
    const snap = await getAdminDb()
      .collection('classLogs')
      .where('tuitionId', '==', tuitionId)
      .where('actionType', '==', 'increment')
      .orderBy('classDate', 'desc')
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ClassLog));
  } catch (error) {
    console.error('Error fetching class dates:', error);
    return [];
  }
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
 * Resets the month: deletes all class logs and sets the count to 0.
 * NOTE: this still discards history; replacing it with "close month" is a planned data-model change.
 */
export async function resetClassCount(tuitionId: string): Promise<{ success: boolean; message: string }> {
  try {
    const adminDb = getAdminDb();
    const deleted = await deleteQueryInChunks(
      adminDb,
      adminDb.collection('classLogs').where('tuitionId', '==', tuitionId)
    );

    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await adminDb.collection('tuitions').doc(tuitionId).update({
      takenClasses: 0,
      currentMonthYear,
      updatedAt: now,
    });

    return { success: true, message: `Class count reset successfully. Deleted ${deleted} class records.` };
  } catch (error) {
    console.error('Error resetting class count:', error);
    return { success: false, message: 'Failed to reset class count' };
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
    batch.delete(tuitionRef);
    await batch.commit();

    return { success: true, message: 'Tuition deleted successfully' };
  } catch (error) {
    console.error('Error deleting tuition:', error);
    return { success: false, message: 'Failed to delete tuition' };
  }
}
