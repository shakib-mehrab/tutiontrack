import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Homework } from '@/types';

// GET /api/homework - Get all homework for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tuitionId = searchParams.get('tuitionId');
    
    const adminDb = getAdminDb();
    let query: FirebaseFirestore.Query = adminDb.collection('homework');
    
    // If tuitionId is specified, just use that (more specific)
    if (tuitionId) {
      query = query.where('tuitionId', '==', tuitionId);
    } else {
      // Otherwise filter based on user role
      if (session.user.role === 'teacher') {
        query = query.where('teacherId', '==', session.user.id);
      } else {
        query = query.where('studentId', '==', session.user.id);
      }
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const homework: Homework[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Homework[];

    return NextResponse.json(homework);
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}

// POST /api/homework - Create new homework
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only teachers can create homework
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can assign homework' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tuitionId, subject, chapter, topic, dueDate, notes } = body;

    // Validate required fields
    if (!tuitionId || !subject || !chapter || !topic || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    // Get tuition details to verify ownership and get student info
    const tuitionDoc = await adminDb.collection('tuitions').doc(tuitionId).get();
    
    if (!tuitionDoc.exists) {
      return NextResponse.json(
        { error: 'Tuition not found' },
        { status: 404 }
      );
    }

    const tuitionData = tuitionDoc.data();
    
    if (tuitionData?.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only assign homework to your own tuitions' },
        { status: 403 }
      );
    }

    if (!tuitionData?.studentId) {
      return NextResponse.json(
        { error: 'This tuition has no student assigned' },
        { status: 400 }
      );
    }

    // Create homework document
    const homeworkData = {
      tuitionId,
      teacherId: session.user.id,
      teacherName: session.user.name,
      studentId: tuitionData.studentId,
      studentName: tuitionData.studentName,
      subject,
      chapter,
      topic,
      dueDate: new Date(dueDate),
      notes: notes || '',
      status: 'assigned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('homework').add(homeworkData);

    return NextResponse.json(
      { 
        id: docRef.id,
        ...homeworkData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating homework:', error);
    return NextResponse.json(
      { error: 'Failed to create homework' },
      { status: 500 }
    );
  }
}
