import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tuition } from '@/types';
import { getClassLogs, getClassDates, deleteTuition } from '@/lib/tuition-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    
    // Use Firebase Admin SDK for server-side operations
    const adminDb = getAdminDb();
    const tuitionDoc = await adminDb.collection('tuitions').doc(resolvedParams.id).get();

    if (!tuitionDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Tuition not found' },
        { status: 404 }
      );
    }

    const tuition = { id: tuitionDoc.id, ...tuitionDoc.data() } as Tuition;

    // Check if user has access to this tuition
    if (tuition.teacherId !== session.user.id && tuition.studentId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all logs and class dates
    const [logs, classDates] = await Promise.all([
      getClassLogs(resolvedParams.id),
      getClassDates(resolvedParams.id)
    ]);

    return NextResponse.json({ 
      success: true, 
      tuition,
      logs,
      classDates
    });
  } catch (error) {
    console.error('Get tuition API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    
    // Use Firebase Admin SDK for server-side operations
    const adminDb = getAdminDb();
    const tuitionDoc = await adminDb.collection('tuitions').doc(resolvedParams.id).get();

    if (!tuitionDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Tuition not found' },
        { status: 404 }
      );
    }

    const tuition = { id: tuitionDoc.id, ...tuitionDoc.data() } as Tuition;

    // Check if the teacher owns this tuition
    if (tuition.teacherId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete the tuition
    const result = await deleteTuition(resolvedParams.id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Delete tuition API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
