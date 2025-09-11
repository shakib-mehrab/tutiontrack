import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tuition, ClassLog } from '@/types';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    console.log('🔴 DELETE route hit! Raw params:', params);
    
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    console.log('✅ Resolved params:', resolvedParams);
    const { id: tuitionId, logId } = resolvedParams;

    // Check if tuition exists and user is the teacher
    console.log('🔍 Checking tuition:', tuitionId);
    const tuitionRef = doc(db, 'tuitions', tuitionId);
    const tuitionDoc = await getDoc(tuitionRef);
    
    if (!tuitionDoc.exists()) {
      console.log('❌ Tuition not found');
      return NextResponse.json(
        { success: false, message: 'Tuition not found' },
        { status: 404 }
      );
    }

    console.log('✅ Tuition found');
    const tuition = tuitionDoc.data() as Tuition;
    
    console.log('👤 Checking teacher authorization. Tuition teacher:', tuition.teacherId, 'Current user:', session.user.id);
    if (tuition.teacherId !== session.user.id) {
      console.log('❌ Not authorized - not your tuition');
      return NextResponse.json(
        { success: false, message: 'Unauthorized - not your tuition' },
        { status: 403 }
      );
    }

    // Check if class log exists
    console.log('🔍 Checking class log:', logId);
    const logRef = doc(db, 'classLogs', logId);
    const logDoc = await getDoc(logRef);
    
    if (!logDoc.exists()) {
      console.log('❌ Class log not found');
      return NextResponse.json(
        { success: false, message: 'Class log not found' },
        { status: 404 }
      );
    }

    console.log('✅ Class log found');

    const classLog = logDoc.data() as ClassLog;
    console.log('📋 Class log data:', classLog);
    
    // Verify this log belongs to the tuition
    console.log('🔗 Verifying log belongs to tuition. Log tuitionId:', classLog.tuitionId, 'Expected:', tuitionId);
    if (classLog.tuitionId !== tuitionId) {
      console.log('❌ Class log does not belong to this tuition');
      return NextResponse.json(
        { success: false, message: 'Class log does not belong to this tuition' },
        { status: 403 }
      );
    }

    // Only allow deletion of increment logs (actual classes)
    console.log('📊 Checking action type. Action:', classLog.actionType);
    if (classLog.actionType !== 'increment') {
      console.log('❌ Only increment logs can be deleted');
      return NextResponse.json(
        { success: false, message: 'Only class attendance logs can be deleted' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting class log...');
    // Delete the class log
    await deleteDoc(logRef);

    console.log('📝 Updating tuition class count...');
    // Update tuition class count (decrement by 1)
    const newTakenClasses = Math.max(0, tuition.takenClasses - 1);
    await updateDoc(tuitionRef, {
      takenClasses: newTakenClasses,
      updatedAt: new Date(),
    });

    console.log('✅ Class log deleted successfully! New count:', newTakenClasses);
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
