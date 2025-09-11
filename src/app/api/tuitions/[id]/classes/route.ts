import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateClassCount, resetClassCount } from '@/lib/tuition-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { action, classDate } = body;

    if (!['increment', 'decrement', 'reset'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'reset') {
      result = await resetClassCount(resolvedParams.id);
    } else {
      const date = classDate ? new Date(classDate) : undefined;
      result = await updateClassCount(resolvedParams.id, action, session.user.id, session.user.name!, date);
    }

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
