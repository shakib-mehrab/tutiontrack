import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition } from '@/types';

export type TuitionAccess =
  | { ok: true; tuition: Tuition; isTeacher: boolean }
  | { ok: false; status: 403 | 404; message: string };

/**
 * Loads a tuition and checks that `userId` may access it.
 * - Default: the owning teacher or the linked student may access.
 * - `teacherOnly`: only the owning teacher may access.
 * Every API route that takes a tuition id must go through this.
 */
export async function getTuitionForUser(
  tuitionId: string,
  userId: string,
  opts: { teacherOnly?: boolean } = {}
): Promise<TuitionAccess> {
  const snap = await getAdminDb().collection('tuitions').doc(tuitionId).get();
  if (!snap.exists) {
    return { ok: false, status: 404, message: 'Tuition not found' };
  }

  const tuition = { ...(snap.data() as Tuition), id: snap.id };
  const isTeacher = tuition.teacherId === userId;
  const isStudent = !!tuition.studentId && tuition.studentId === userId;

  if (opts.teacherOnly ? !isTeacher : !isTeacher && !isStudent) {
    return { ok: false, status: 403, message: 'Access denied' };
  }

  return { ok: true, tuition, isTeacher };
}
