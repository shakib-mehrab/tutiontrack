import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition, ClassLog } from '@/types';
import { cycleOfLog, cycleOfTuition } from '@/lib/tuition-helpers';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: tuitionId, logId } = resolvedParams;

    // Use Admin SDK for server-side operations
    const adminDb = getAdminDb();

    // Check if tuition exists and user is the teacher
    const tuitionDoc = await adminDb.collection('tuitions').doc(tuitionId).get();
    
    if (!tuitionDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Tuition not found' },
        { status: 404 }
      );
    }

    const tuition = tuitionDoc.data() as Tuition;
    
    if (tuition.teacherId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - not your tuition' },
        { status: 403 }
      );
    }

    // Check if class log exists
    const logDoc = await adminDb.collection('classLogs').doc(logId).get();
    
    if (!logDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Class log not found' },
        { status: 404 }
      );
    }

    const classLog = logDoc.data() as ClassLog;
    
    // Verify this log belongs to the tuition
    if (classLog.tuitionId !== tuitionId) {
      return NextResponse.json(
        { success: false, message: 'Class log does not belong to this tuition' },
        { status: 403 }
      );
    }

    // Only allow deletion of increment logs (actual classes)
    if (classLog.actionType !== 'increment') {
      return NextResponse.json(
        { success: false, message: 'Only class attendance logs can be deleted' },
        { status: 400 }
      );
    }

    // Closed months are read-only; deleting from them would wrongly lower this month's count.
    if (cycleOfLog(classLog) !== cycleOfTuition(tuition)) {
      return NextResponse.json(
        { success: false, message: 'This class belongs to a closed month and cannot be deleted' },
        { status: 400 }
      );
    }

    // Delete the log and decrement the count atomically
    const tuitionRef = adminDb.collection('tuitions').doc(tuitionId);
    const logRef = adminDb.collection('classLogs').doc(logId);
    const newTakenClasses = await adminDb.runTransaction(async (tx) => {
      const [freshTuition, freshLog] = await Promise.all([tx.get(tuitionRef), tx.get(logRef)]);
      const current = (freshTuition.data() as Tuition | undefined)?.takenClasses ?? 0;
      if (!freshLog.exists) return current; // already deleted by a concurrent request
      const next = Math.max(0, current - 1);
      tx.delete(logRef);
      tx.update(tuitionRef, { takenClasses: next, updatedAt: new Date() });
      return next;
    });

    return NextResponse.json({
      success: true,
      message: 'Class log deleted successfully',
      newCount: newTakenClasses,
    });
  } catch (error) {
    console.error('Delete class log API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
