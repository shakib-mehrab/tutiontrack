import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition, ClassLog } from '@/types';

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

    // Delete the class log
    await adminDb.collection('classLogs').doc(logId).delete();

    // Update tuition class count (decrement by 1)
    const newTakenClasses = Math.max(0, tuition.takenClasses - 1);
    await adminDb.collection('tuitions').doc(tuitionId).update({
      takenClasses: newTakenClasses,
      updatedAt: new Date(),
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
