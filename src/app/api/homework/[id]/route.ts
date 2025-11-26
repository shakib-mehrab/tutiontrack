import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

// GET /api/homework/[id] - Get specific homework
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('homework').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    const homeworkData = doc.data();

    // Verify user has access to this homework
    if (
      homeworkData?.teacherId !== session.user.id &&
      homeworkData?.studentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...homeworkData,
    });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}

// PUT /api/homework/[id] - Update homework
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const adminDb = getAdminDb();
    const docRef = adminDb.collection('homework').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    const homeworkData = doc.data();

    // Only the teacher who created it can update
    if (homeworkData?.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the teacher who assigned this homework can update it' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update allowed fields
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.chapter !== undefined) updateData.chapter = body.chapter;
    if (body.topic !== undefined) updateData.topic = body.topic;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.feedback !== undefined) updateData.feedback = body.feedback;
    
    // Handle status change to completed
    if (body.status === 'completed' && homeworkData?.status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Error updating homework:', error);
    return NextResponse.json(
      { error: 'Failed to update homework' },
      { status: 500 }
    );
  }
}

// DELETE /api/homework/[id] - Delete homework
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('homework').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    const homeworkData = doc.data();

    // Only the teacher who created it can delete
    if (homeworkData?.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the teacher who assigned this homework can delete it' },
        { status: 403 }
      );
    }

    // Delete all comments first
    const commentsSnapshot = await docRef.collection('comments').get();
    const batch = adminDb.batch();
    
    commentsSnapshot.docs.forEach(commentDoc => {
      batch.delete(commentDoc.ref);
    });
    
    await batch.commit();

    // Delete the homework document
    await docRef.delete();

    return NextResponse.json(
      { message: 'Homework deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting homework:', error);
    return NextResponse.json(
      { error: 'Failed to delete homework' },
      { status: 500 }
    );
  }
}
