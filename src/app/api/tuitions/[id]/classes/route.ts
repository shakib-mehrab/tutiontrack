import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateClassCount, resetClassCount } from '@/lib/tuition-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('Unauthorized access attempt to class count API');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only teachers can modify class counts
    if (session.user.role !== 'teacher') {
      console.error('Student attempted to modify class count:', session.user.id);
      return NextResponse.json(
        { success: false, message: 'Access denied. Only teachers can modify class counts.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { action, classDate } = body;

    console.log('Class count API called:', {
      tuitionId: resolvedParams.id,
      action,
      classDate,
      userId: session.user.id,
      userName: session.user.name
    });

    if (!['increment', 'decrement', 'reset'].includes(action)) {
      console.error('Invalid action provided:', action);
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'reset') {
      console.log('Resetting class count for tuition:', resolvedParams.id);
      result = await resetClassCount(resolvedParams.id, true); // true = server-side
    } else {
      const date = classDate ? new Date(classDate) : undefined;
      console.log('Updating class count:', { action, date });
      result = await updateClassCount(resolvedParams.id, action, session.user.id, session.user.name!, date, true); // true = server-side
    }

    console.log('Class count operation result:', result);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Update class count API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
