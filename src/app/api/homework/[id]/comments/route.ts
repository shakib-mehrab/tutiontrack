import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

// GET /api/homework/[id]/comments - Get all comments for homework
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
    // Verify user has access to this homework
    const homeworkDoc = await adminDb.collection('homework').doc(id).get();
    
    if (!homeworkDoc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    const homeworkData = homeworkDoc.data();
    
    if (
      homeworkData?.teacherId !== session.user.id &&
      homeworkData?.studentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get comments
    const commentsSnapshot = await adminDb
      .collection('homework')
      .doc(id)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();

    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/homework/[id]/comments - Add a comment
export async function POST(
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
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    // Verify user has access to this homework
    const homeworkDoc = await adminDb.collection('homework').doc(id).get();
    
    if (!homeworkDoc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    const homeworkData = homeworkDoc.data();
    
    if (
      homeworkData?.teacherId !== session.user.id &&
      homeworkData?.studentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create comment
    const commentData = {
      homeworkId: id,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      comment: comment.trim(),
      createdAt: new Date(),
    };

    const commentRef = await adminDb
      .collection('homework')
      .doc(id)
      .collection('comments')
      .add(commentData);

    return NextResponse.json(
      {
        id: commentRef.id,
        ...commentData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
